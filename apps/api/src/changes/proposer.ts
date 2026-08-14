import { z } from "zod";
import { llmEnv } from "../env.js";
import { operations, type Proposal } from "./operations.js";

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
 * O que o `generateObject` entrega e o parse manual não entregava: ele negocia
 * o modo de saída com o provedor — `json_schema` nativo quando o modelo
 * suporta, modo-ferramenta quando não — e tenta de novo quando a saída não
 * valida. No OpenRouter isso não é detalhe: o suporte a structured output
 * varia por modelo, e trocar de modelo passava a ser descobrir em produção.
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
  const [{ generateObject }, { createOpenRouter }] = await Promise.all([
    import("ai"),
    import("@openrouter/ai-sdk-provider"),
  ]);

  const openrouter = createOpenRouter({
    apiKey: env().OPENROUTER_API_KEY,
    extraBody: { usage: { include: true } },
  });

  return { generateObject, openrouter };
}

/* ── Schema da saída ──────────────────────────────────────────────────────── */

/**
 * O modelo precisa de uma forma de dizer "não sei fazer isso".
 *
 * Sem `unsupported`, todo pedido casa com alguma coisa — e um pedido como
 * "adicione o Mewtwo" seria encaixado à força na operação mais parecida, que é
 * o modo de falhar mais perigoso que existe aqui: uma escrita plausível na
 * linha errada. Dar a saída explícita transforma isso num aviso na tela.
 */
const naoSuportado = z.object({
  kind: z.literal("unsupported"),
  reason: z
    .string()
    .describe("Why no available operation fits this request, in one sentence."),
});

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
 * O union é montado a partir do registro, não escrito à mão.
 *
 * Assim, acrescentar uma operação em operations.ts já a torna proponível: não
 * existe uma segunda lista para esquecer de atualizar. Foi exatamente esse
 * tipo de lista duplicada que fez o design system divergir do produto.
 */
function schemaDaProposta(kinds: string[] | null) {
  const membros = [
    ...operacoesVisiveis(kinds).map((op) =>
      z.object({
        kind: z.literal(op.kind),
        args: op.schema as z.ZodType<Record<string, unknown>>,
      }),
    ),
    naoSuportado,
  ];

  return z.object({
    rationale: z
      .string()
      .describe(
        "One or two sentences explaining the choice. Shown to the human who approves.",
      ),
    // `as any`: o Zod tipa discriminatedUnion sobre uma tupla literal, e esta
    // lista é montada em tempo de execução. O runtime aceita o array.
    operation: z.discriminatedUnion("kind", membros as any),
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
  const { generateObject, openrouter } = await carregarSdk();

  const { object, usage, providerMetadata } = await generateObject({
    model: openrouter.chat(modelo),
    schema: schemaDaProposta(kinds),
    system: SYSTEM.replace("{{OPERATIONS}}", cardapio(kinds)),
    prompt: pedido,
    // Extração, não redação: variar a saída aqui só produz proposta diferente
    // para o mesmo pedido, que é o oposto do que se quer num fluxo auditável.
    temperature: 0,
  });

  const op = object.operation as { kind: string; args?: Record<string, unknown>; reason?: string };

  if (op.kind === "unsupported") {
    return {
      proposal: null,
      unsupportedReason: op.reason ?? "No available operation fits this request.",
      rationale: object.rationale,
      model: modelo,
      costUsd: extrairCusto(providerMetadata),
      tokens: usage?.totalTokens ?? null,
    };
  }

  return {
    proposal: { kind: op.kind, args: op.args ?? {} },
    unsupportedReason: null,
    rationale: object.rationale,
    model: modelo,
    costUsd: extrairCusto(providerMetadata),
    tokens: usage?.totalTokens ?? null,
  };
}
