import { z } from "zod";
import { llmEnv } from "../env.js";
import { operations, operationsByKind, type Proposal } from "./operations.js";

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
  const [{ generateText, tool }, { createOpenRouter }] = await Promise.all([
    import("ai"),
    import("@openrouter/ai-sdk-provider"),
  ]);

  const openrouter = createOpenRouter({
    apiKey: env().OPENROUTER_API_KEY,
    extraBody: { usage: { include: true } },
  });

  return { generateText, tool, openrouter };
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
      .enum(["unsupported", ...visiveis.map((o) => o.kind)] as [string, ...string[]])
      .describe("The operation to perform, or 'unsupported' to decline."),
    reason: z
      .string()
      .optional()
      .describe("Required when kind is 'unsupported': why no operation fits."),
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

Rules that matter:
- Attack values in this game are 8, 9 or 10 — never the video-game damage
  number. A request mentioning 90 or 120 is almost certainly the video-game
  value; use "unsupported" and say so rather than guessing a conversion.
- A Pokémon has at most one attack per type. There is no "second fire move".
- Innate abilities are ones a Pokémon already has. Type talents are ones any
  Pokémon of that type can acquire. Pick the operation that matches which of
  the two the request names.
- Pokémon are addressed by lowercase slug, e.g. "charizard".
- If the request is ambiguous, names something that does not exist, or asks for
  anything outside the list above — creating rows, deleting rows, bulk edits —
  return "unsupported" with the reason. Refusing is correct behaviour here, not
  failure.`;

/* ── Resultado ────────────────────────────────────────────────────────────── */

export interface PropostaGerada {
  /** Nulo quando o modelo respondeu `unsupported`. */
  proposal: Proposal | null;
  /** Preenchido quando `proposal` é nulo. */
  unsupportedReason: string | null;
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
  const { generateText, tool, openrouter } = await carregarSdk();

  const { toolCalls, usage, providerMetadata } = await generateText({
    model: openrouter.chat(modelo),
    system: SYSTEM.replace("{{OPERATIONS}}", cardapio(kinds)),
    prompt: pedido,
    tools: {
      /**
       * Uma ferramenta só, sem `execute`.
       *
       * Sem `execute`, o SDK devolve a chamada em vez de rodá-la — que é
       * exatamente o que se quer: a "execução" desta proposta é uma pessoa
       * clicando em Approve, horas depois, em outro processo.
       */
      submit_proposal: tool({
        description: "Submit exactly one typed operation, or decline the request.",
        inputSchema: schemaDaProposta(kinds),
      }),
    },
    // Obriga a ferramenta. Sem isto o modelo responde em prosa quando acha o
    // pedido estranho — e prosa não é proposta.
    toolChoice: "required",
    // Extração, não redação: variar a saída aqui só produz proposta diferente
    // para o mesmo pedido, que é o oposto do que se quer num fluxo auditável.
    temperature: 0,
  });

  const chamada = toolCalls[0];
  if (!chamada) {
    throw new Error("O modelo não devolveu proposta nenhuma.");
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
      unsupportedReason: saida.reason ?? "No available operation fits this request.",
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

  return { ...comum, proposal: { kind: saida.kind, args }, unsupportedReason: null };
}
