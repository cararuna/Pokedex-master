import { z } from "zod";
import { llmEnv } from "../env.js";
import { operations, operationsByKind, type Proposal } from "./operations.js";
import { consultarAlvos, rotularCandidato, type Candidato } from "./lookup.js";

/**
 * Converte o pedido em texto livre numa operação tipada.
 *
 * **Por que o Vercel AI SDK aqui, e o laço à mão no agente.** São problemas
 * diferentes. O harness do agente é uma conversa com várias voltas, onde as
 * decisões de custo, latência e parada são o produto — esconder isso atrás de
 * `agent.run()` seria abrir mão do que importa. Aqui não há conversa: é uma
 * extração de um turno só, com saída obrigada a casar com um schema. É
 * decodificação restrita, e reimplementá-la não ensina nada.
 *
 * **Por que ferramenta e não `generateObject`.** A escolha óbvia era
 * `generateObject`, e ela falhou de forma instrutiva: com
 * `anthropic/claude-sonnet-4.5` pelo OpenRouter, os dez casos do
 * `check-proposer` voltaram vazios. O modelo respondeu JSON dentro de uma
 * cerca markdown, com campos que ele inventou — `{"operation": "…",
 * "pokemon": "…", "power": 10}` — nada parecido com o schema.
 *
 * O motivo: a Anthropic não expõe `response_format: json_schema`, e o
 * OpenRouter repassa o pedido sem ele. O `generateObject` do AI SDK v7 só tem
 * esse caminho — o `mode: 'tool'` que existia na v4 foi removido —, então ele
 * degradou para pedir JSON em prosa, sem sequer injetar o schema no prompt.
 *
 * Tool calling, por outro lado, é nativo na Anthropic e já é o que o harness
 * do agente usa neste mesmo projeto, pelo mesmo provedor. Então o schema entra
 * como `inputSchema` de uma ferramenta única, com `toolChoice: "required"`.
 * O resultado é o mesmo que se queria — decodificação restrita por schema — só
 * que pelo caminho que este par modelo/provedor de fato suporta.
 *
 * Vale como lição de portfólio, não como derrota: "usei o AI SDK" e "structured
 * output funciona em qualquer modelo" são duas afirmações diferentes, e a
 * segunda é falsa. Foi um script de validação que mostrou isso, não produção.
 *
 * **O schema não é a fronteira de segurança.** Ele melhora o acerto de
 * primeira; quem decide o que executa é `parseProposal`, em operations.ts, que
 * revalida contra o registro. O caminho do modelo até o banco passa por lá
 * sempre — inclusive quando a operação vem lida de `change_requests`, gravada
 * meses antes por uma versão anterior do cardápio.
 */

const env = () => llmEnv();

/**
 * O AI SDK entra por import dinâmico, como o harness do agente.
 *
 * Import estático arrastaria `ai` e o provedor do OpenRouter para o cold start
 * de **toda** requisição da função serverless — inclusive `/pokemon`, que não
 * tem nada a ver com modelo nenhum. O custo é latência na primeira chamada de
 * cada instância, paga por quem só queria a lista de cartas.
 *
 * `usage.include` é o que faz o OpenRouter devolver o custo em dólar. Sem esse
 * campo o provedor responde só com contagem de tokens, e transformar token em
 * dinheiro exigiria manter uma tabela de preços à mão — que envelhece toda vez
 * que um modelo muda de preço.
 */
async function carregarSdk() {
  const [{ generateText, tool, stepCountIs }, { createOpenRouter }] = await Promise.all([
    import("ai"),
    import("@openrouter/ai-sdk-provider"),
  ]);

  const openrouter = createOpenRouter({
    apiKey: env().OPENROUTER_API_KEY,
    extraBody: { usage: { include: true } },
  });

  return { generateText, tool, stepCountIs, openrouter };
}

/* ── Schema da saída ──────────────────────────────────────────────────────── */

/**
 * As operações visíveis para esta chamada.
 *
 * `null` é o cardápio inteiro; uma lista restringe. Quem restringe é a
 * política de papéis: um editor propõe correção de texto, não mudança de
 * valor de ataque.
 *
 * **Filtrar o cardápio é diferente de recusar depois.** Recusando depois, o
 * modelo produz uma proposta que a política descarta — custou uma chamada paga
 * e o histórico enche de tentativa inválida. Filtrando antes, ele nem enxerga
 * a operação, e responde `unsupported` sozinho, com um motivo que faz sentido
 * para quem pediu. É privilégio mínimo aplicado ao próprio menu do modelo.
 *
 * A recusa depois continua existindo, no serviço — as duas camadas cobrem
 * coisas diferentes: esta evita o gasto, aquela garante o resultado.
 */
function operacoesVisiveis(kinds: string[] | null) {
  return kinds === null ? operations : operations.filter((op) => kinds.includes(op.kind));
}

/**
 * O schema da ferramenta — **plano**, e isso custou uma rodada de depuração.
 *
 * A forma natural era `{ rationale, operation: discriminatedUnion(...) }`. Ela
 * gera `oneOf` aninhado dentro de uma propriedade, e schema de ferramenta da
 * Anthropic não lida bem com isso: o modelo devolveu o objeto certo
 * **serializado como string** dentro do campo, e o SDK marcou a chamada como
 * inválida. O conteúdo estava correto; a estrutura não sobreviveu.
 *
 * Achatar resolve porque troca o que o modelo precisa construir. Um `enum` no
 * primeiro nível mais campos no primeiro nível é a forma mais universalmente
 * suportada que existe em tool calling — nenhum provedor tropeça nela.
 *
 * O preço é que todo campo vira opcional, então o schema sozinho não garante
 * que os campos certos vieram para o `kind` escolhido. Isso não custa
 * segurança: quem valida de verdade é `parseProposal`, contra o schema real da
 * operação, e ele já era a fronteira — o schema da ferramenta sempre foi
 * ajuda de pontaria, não trava.
 *
 * Os campos continuam derivados do registro, um por operação visível. Nada
 * aqui é uma segunda lista para esquecer de atualizar.
 */
function schemaDaProposta(kinds: string[] | null) {
  const visiveis = operacoesVisiveis(kinds);
  const campos: Record<string, z.ZodType> = {};

  for (const op of visiveis) {
    const shape = (op.schema as unknown as z.ZodObject<z.ZodRawShape>).shape;
    for (const [nome, tipo] of Object.entries(shape)) {
      // Nomes repetidos entre operações querem dizer a mesma coisa
      // (`description` em talento e em habilidade). O primeiro vence.
      campos[nome] ??= (tipo as z.ZodType).optional();
    }
  }

  return z.object({
    rationale: z
      .string()
      .describe(
        "One or two sentences explaining the choice. Shown to the human who approves.",
      ),
    /**
     * `unsupported` é o que dá ao modelo uma forma de dizer "não sei fazer
     * isso". Sem ele, todo pedido casa com alguma coisa — e "adicione o
     * Mewtwo" seria encaixado à força na operação mais parecida, que é o modo
     * de falhar mais perigoso aqui: uma escrita plausível na linha errada.
     */
    kind: z
      .enum([
        "unsupported",
        "needs_clarification",
        ...visiveis.map((o) => o.kind),
      ] as [string, ...string[]])
      .describe(
        "The operation to perform, 'needs_clarification' when two or more " +
          "targets fit, or 'unsupported' to decline.",
      ),
    reason: z
      .string()
      .optional()
      .describe("Required when kind is 'unsupported': why no operation fits."),
    question: z
      .string()
      .optional()
      .describe("Required when kind is 'needs_clarification': what to ask the human."),
    candidate_names: z
      .array(z.string())
      .optional()
      .describe(
        "Required when kind is 'needs_clarification': the exact names returned " +
          "by lookup_targets that could be the target.",
      ),
    ...campos,
  });
}

/** Catálogo em texto, para o modelo saber o que existe antes de escolher. */
function cardapio(kinds: string[] | null): string {
  return operacoesVisiveis(kinds)
    .map((op) => `- ${op.kind}: ${op.description}`)
    .join("\n");
}

const SYSTEM = `You are the change proposer for a Pokémon board-game companion.

A game master writes a request in plain language. You turn it into exactly one
typed operation. You never write SQL and you never invent identifiers.

Available operations:
{{OPERATIONS}}

## How to work

1. If the request is about an ability or a talent, call lookup_targets FIRST.
   Never guess a name. The request often describes the effect instead of the
   name — "the ability about sunny day" — and only the lookup knows both the
   real name and which of the two mechanisms it belongs to.
2. Then call submit_proposal exactly once.

## Rules that matter

- Attack values in this game are 8, 9 or 10 — never the video-game damage
  number. A request mentioning 90 or 120 is almost certainly the video-game
  value; use "unsupported" and say so rather than guessing a conversion.
- A Pokémon has at most one attack per type. There is no "second fire move".
- Innate abilities are ones a Pokémon already has (update_ability_text). Type
  talents are ones any Pokémon of that type can acquire (update_talent_text).
  Do not infer which one from the wording — the lookup tells you.
- Pokémon are addressed by lowercase slug, e.g. "charizard".
- Asking for anything outside the operation list — creating rows, deleting
  rows, bulk edits — is "unsupported". Refusing is correct behaviour, not
  failure.

## When two or more targets fit

Use "needs_clarification" and list their exact names in candidate_names.

This is not a fallback for being unsure — it is the correct answer when the
request genuinely does not contain enough to choose. Two abilities can carry
the *same description in different tables*, and then no amount of reasoning
picks the right one: the information simply is not in the request. Guessing
there writes a plausible value into the wrong row, and the human reviewing the
diff sees one plausible value becoming another and approves it.

Still supply the new text (description) — the change is the same either way,
only the target is in doubt.`;

/* ── Resultado ────────────────────────────────────────────────────────────── */

/** Uma opção pronta para virar mudança com um clique. */
export interface CandidatoDeMudanca {
  label: string;
  detail: string;
  operation: Proposal;
}

export interface PropostaGerada {
  /** Preenchido só quando o modelo escolheu um alvo único. */
  proposal: Proposal | null;
  /** Preenchido quando o modelo recusou. */
  unsupportedReason: string | null;
  /**
   * Preenchido quando mais de um alvo servia.
   *
   * Cada candidato já é uma operação completa: escolher não chama o modelo de
   * novo. Guardar só o identificador do alvo obrigaria uma segunda passada
   * para montar os argumentos — uma segunda chance de errar, exatamente no
   * ponto em que a pessoa acabou de remover a dúvida.
   */
  clarification: { question: string; candidates: CandidatoDeMudanca[] } | null;
  rationale: string;
  model: string;
  costUsd: number | null;
  tokens: number | null;
}

/**
 * Custo em dólar da chamada, quando o provedor informa.
 *
 * Defensivo de propósito: o formato de `providerMetadata` é do provedor, não
 * do SDK, e mudar de provedor não pode derrubar a proposta inteira por causa
 * de um número que só vai para um relatório.
 */
function extrairCusto(metadata: unknown): number | null {
  const openrouter = (metadata as any)?.openrouter;
  const bruto = openrouter?.usage?.cost ?? openrouter?.cost;
  return typeof bruto === "number" ? bruto : null;
}

export async function proporMudanca(
  pedido: string,
  opcoes: { model?: string; kinds?: string[] | null } = {},
): Promise<PropostaGerada> {
  const modelo = opcoes.model ?? env().OPENROUTER_MODEL;
  const kinds = opcoes.kinds ?? null;
  const { generateText, tool, stepCountIs, openrouter } = await carregarSdk();

  /**
   * O que o retrieval devolveu ao longo da conversa.
   *
   * Precisa ser acumulado aqui porque, ao pedir desambiguação, o modelo cita
   * os candidatos **pelo nome** — e transformar nome em operação exige o
   * mecanismo e o tipo, que só a linha do banco tem. Confiar no modelo para
   * repetir esses campos seria reintroduzir o palpite no exato ponto onde
   * estamos tentando eliminá-lo.
   */
  const vistos: Candidato[] = [];

  const { steps, usage, providerMetadata } = await generateText({
    model: openrouter.chat(modelo),
    system: SYSTEM.replace("{{OPERATIONS}}", cardapio(kinds)),
    prompt: pedido,
    tools: {
      /**
       * Esta **tem** `execute`, então o SDK a roda e devolve o resultado ao
       * modelo — o laço continua. É o que transforma a extração de um turno
       * num agente de dois passos: consultar, depois propor.
       */
      lookup_targets: tool({
        description:
          "Find abilities and talents that could be the target. Returns the exact " +
          "name of each and whether it is an innate ability or a type talent. " +
          "Call this before proposing any change to an ability or talent.",
        inputSchema: z.object({
          pokemon: z
            .string()
            .optional()
            .describe("Lowercase slug, when the request names a Pokémon"),
          contains: z
            .string()
            .optional()
            .describe("Words from the effect, e.g. 'dia ensolarado'"),
        }),
        execute: async (consulta) => {
          const achados = await consultarAlvos(consulta);
          vistos.push(...achados);
          return achados.length > 0
            ? achados
            : { note: "No ability or talent matched. Do not invent one." };
        },
      }),

      /**
       * Esta **não** tem `execute`.
       *
       * Sem ele o SDK devolve a chamada em vez de rodá-la, e o laço para — que
       * é exatamente o que se quer: a "execução" desta proposta é uma pessoa
       * clicando em Approve, horas depois, em outro processo.
       */
      submit_proposal: tool({
        description:
          "Submit exactly one typed operation, ask for clarification, or decline.",
        inputSchema: schemaDaProposta(kinds),
      }),
    },
    // Obriga a ferramenta. Sem isto o modelo responde em prosa quando acha o
    // pedido estranho — e prosa não é proposta.
    toolChoice: "required",
    /**
     * Teto de voltas. Consultar e propor são dois passos; quatro dá margem
     * para uma segunda consulta — quando a primeira volta vazia e vale tentar
     * outro termo — sem permitir que o modelo fique consultando para sempre
     * às custas de quem está esperando na tela.
     */
    stopWhen: stepCountIs(4),
    // Extração, não redação: variar a saída aqui só produz proposta diferente
    // para o mesmo pedido, que é o oposto do que se quer num fluxo auditável.
    temperature: 0,
  });

  const chamada = steps
    .flatMap((s) => s.toolCalls)
    .find((c) => c.toolName === "submit_proposal");

  if (!chamada) {
    throw new Error(
      "O modelo consultou o catálogo mas não chegou a propor nada dentro do limite de passos.",
    );
  }
  // O SDK marca assim a chamada cujos argumentos não casaram com o schema.
  // Sem esta checagem, `input` viria com o que o modelo mandou de qualquer
  // jeito, e o defeito só apareceria lá na frente como campo faltando.
  if (chamada.invalid) {
    throw new Error(
      `O modelo devolveu uma chamada inválida: ${JSON.stringify(chamada.input).slice(0, 300)}`,
    );
  }

  const saida = chamada.input as Record<string, unknown> & {
    rationale: string;
    kind: string;
    reason?: string;
    question?: string;
    candidate_names?: string[];
  };

  const comum = {
    rationale: saida.rationale,
    model: modelo,
    costUsd: extrairCusto(providerMetadata),
    tokens: usage?.totalTokens ?? null,
  };

  if (saida.kind === "unsupported") {
    return {
      ...comum,
      proposal: null,
      clarification: null,
      unsupportedReason: saida.reason ?? "No available operation fits this request.",
    };
  }

  if (saida.kind === "needs_clarification") {
    const candidatos = montarCandidatos(saida.candidate_names ?? [], vistos, saida.description);

    /**
     * Menos de dois candidatos não é dúvida.
     *
     * Acontece quando o modelo cita um nome que o retrieval não devolveu — ou
     * seja, inventou. Perguntar "qual destes?" mostrando uma opção só empurra
     * a invenção para a tela com cara de escolha legítima. Vira recusa.
     */
    if (candidatos.length < 2) {
      return {
        ...comum,
        proposal: null,
        clarification: null,
        unsupportedReason:
          "Could not identify which ability or talent this refers to. " +
          "Name it directly, or describe its effect in the words used on the card.",
      };
    }

    return {
      ...comum,
      proposal: null,
      unsupportedReason: null,
      clarification: {
        question:
          saida.question ?? "More than one ability matches. Which one did you mean?",
        candidates: candidatos,
      },
    };
  }

  /**
   * Remontagem do `{ kind, args }` a partir dos campos planos.
   *
   * Quem diz de quais campos aquele `kind` é feito é o schema da própria
   * operação — não uma tabela paralela aqui. Campo que o modelo mandou e não
   * pertence à operação escolhida é descartado em silêncio; se faltar algum,
   * quem reclama é `parseProposal`, com o nome do campo.
   */
  const op = operationsByKind.get(saida.kind);
  if (!op) {
    throw new Error(`O modelo escolheu uma operação desconhecida: ${saida.kind}`);
  }

  const shape = (op.schema as unknown as z.ZodObject<z.ZodRawShape>).shape;
  const args: Record<string, unknown> = {};
  for (const nome of Object.keys(shape)) {
    if (saida[nome] !== undefined) args[nome] = saida[nome];
  }

  return {
    ...comum,
    proposal: { kind: saida.kind, args },
    unsupportedReason: null,
    clarification: null,
  };
}

/**
 * Nomes citados pelo modelo → operações prontas para aplicar.
 *
 * O modelo devolve só o nome; o **mecanismo** e o **tipo** vêm da linha que o
 * retrieval trouxe, nunca do que ele escreveu. É a diferença entre desambiguar
 * e trocar um palpite por outro: se o nome não estiver entre os candidatos
 * consultados, ele é descartado — inclusive quando soa plausível.
 *
 * A mudança em si é a mesma nas duas pontas (o texto novo); o que estava em
 * dúvida era só o alvo. Por isso um candidato consegue ser uma operação
 * inteira, e escolher não custa nada.
 */
function montarCandidatos(
  nomes: string[],
  vistos: Candidato[],
  descricaoNova: unknown,
): CandidatoDeMudanca[] {
  if (typeof descricaoNova !== "string" || descricaoNova.trim() === "") return [];

  const porNome = new Map(vistos.map((c) => [c.name.toLowerCase(), c]));
  const usados = new Set<string>();
  const saida: CandidatoDeMudanca[] = [];

  for (const nome of nomes) {
    const c = porNome.get(nome.trim().toLowerCase());
    // O mesmo candidato pode voltar de duas consultas; a lista da tela não
    // pode mostrar a mesma opção duas vezes.
    if (!c || usados.has(c.name.toLowerCase())) continue;
    usados.add(c.name.toLowerCase());

    saida.push({
      label: rotularCandidato(c),
      detail: c.description,
      operation:
        c.mechanism === "innate"
          ? {
              kind: "update_ability_text",
              args: { ability_name: c.name, description: descricaoNova },
            }
          : {
              kind: "update_talent_text",
              args: { type: c.type, talent_name: c.name, description: descricaoNova },
            },
    });
  }

  return saida;
}
