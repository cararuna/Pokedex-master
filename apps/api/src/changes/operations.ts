import { z } from "zod";
import { db } from "../db/client.js";

/**
 * Registro de operações de escrita.
 *
 * É a peça que sustenta a feature inteira, e a regra é curta:
 *
 *   **o modelo não escreve SQL — ele escolhe um verbo de um cardápio fechado
 *   e preenche um formulário validado.**
 *
 * A tentação natural era dar uma ferramenta `executar_sql` ao agente. Ela
 * funciona em demonstração e é indefensável em produção: um `update` sem
 * `where` apaga a mesa inteira, e nenhuma validação de argumento pega isso,
 * porque o argumento é uma string opaca. Aqui o pior caso de uma alucinação é
 * uma operação que o Zod rejeita antes de qualquer I/O.
 *
 * Cada operação sabe quatro coisas, e as quatro são obrigatórias:
 *
 *   read     como está agora        → alimenta o diff e detecta drift
 *   project  como ficaria           → o "depois" da tela, sem escrever nada
 *   apply    escreve                → devolve a linha como o banco a deixou
 *   invert   a operação que desfaz  → é o que torna o rollback confiável
 *
 * `invert` é calculada **no momento de aplicar**, não na hora do rollback. Se
 * fosse derivada depois, dependeria do estado atual da tabela — que já pode
 * ter mudado — e desfazer devolveria o dado para um valor que nunca existiu.
 *
 * Sobre o idioma: os `kind` e os campos são em inglês porque são o vocabulário
 * que vai para o modelo, e o prompt do agente é inglês desde a v3. Comentário
 * segue português, como no resto do repositório.
 */

/* ── Erros ────────────────────────────────────────────────────────────────── */

/**
 * Falha esperada de operação — alvo inexistente, alvo ambíguo, mudança nula.
 *
 * Tem `code` porque a rota precisa distinguir "não achei o Pokémon" (culpa do
 * pedido, 422) de "o banco caiu" (500). Sem isso, todo erro vira 500 e quem
 * está na tela não sabe se corrige o texto ou chama alguém.
 */
export class OperationError extends Error {
  constructor(
    readonly code: "not_found" | "ambiguous" | "no_change" | "invalid",
    message: string,
  ) {
    super(message);
    this.name = "OperationError";
  }
}

/* ── Contrato ─────────────────────────────────────────────────────────────── */

export type Row = Record<string, unknown>;

/** Uma proposta é o par verbo + formulário. É tudo que trafega e se persiste. */
export interface Proposal {
  kind: string;
  args: Record<string, unknown>;
}

export interface OperationDef<A> {
  kind: string;
  /** Vai para o modelo. Diz quando usar, não só o que faz. */
  description: string;
  schema: z.ZodType<A>;
  read(args: A): Promise<Row>;
  project(args: A, before: Row): Row;
  apply(args: A): Promise<Row>;
  invert(args: A, before: Row): Proposal;
  /** Uma linha em inglês para a tela de aprovação. */
  summary(args: A): string;
  /**
   * A operação mexe em prosa que o RAG indexou?
   *
   * Só texto conta. Mudar `game_power` de 9 para 10 não altera nenhum chunk;
   * mudar a descrição de um talento deixa o índice vetorial mentindo até a
   * próxima reindexação, e o agente passa a responder com o texto antigo.
   */
  reindexesRag: boolean;
}

/* ── Auxiliares de resolução ──────────────────────────────────────────────── */

/**
 * Slug → id do Pokémon.
 *
 * Existe porque o modelo fala em nomes ("charizard") e `pokemon_moves` é
 * chaveada por id. Resolver aqui, e não deixar o modelo adivinhar o id, tira
 * uma classe inteira de alucinação do caminho: número inventado vira "não
 * encontrado" com nome legível, em vez de escrita silenciosa na linha errada.
 */
async function resolverPokemon(slug: string): Promise<number> {
  const { data, error } = await db
    .from("pokemon")
    .select("id")
    .eq("slug", slug.toLowerCase().trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new OperationError("not_found", `No Pokémon with slug "${slug}".`);
  return (data as { id: number }).id;
}

/** Nome de habilidade → id, exigindo que o nome seja único. */
async function resolverHabilidade(nome: string): Promise<{ id: number; name: string }> {
  const { data, error } = await db
    .from("abilities")
    .select("id, name")
    .ilike("name", nome.trim());

  if (error) throw new Error(error.message);
  const achadas = (data ?? []) as { id: number; name: string }[];

  if (achadas.length === 0) {
    throw new OperationError("not_found", `No ability named "${nome}".`);
  }
  // Ambíguo é diferente de inexistente: aqui a correção é o pedido ser mais
  // específico, não o alvo não existir. Escolher a primeira seria escrever na
  // linha errada sem ninguém perceber.
  if (achadas.length > 1) {
    throw new OperationError(
      "ambiguous",
      `"${nome}" matches ${achadas.length} abilities: ${achadas.map((a) => a.name).join(", ")}.`,
    );
  }
  return achadas[0];
}

/* ── Operações ────────────────────────────────────────────────────────────── */

/**
 * O valor do golpe na escala do tabuleiro.
 *
 * O `check` em `pokemon_moves` já recusa fora de 8..10, mas repetir o limite
 * no Zod muda quem reclama: o modelo recebe "esperado 8..10" e corrige na
 * própria proposta, em vez de a mesa aprovar algo que o banco vai rejeitar
 * depois. Validação perto de quem erra.
 */
const gamePower = z
  .number()
  .int()
  .min(8)
  .max(10)
  .describe("Board-game value: 8, 9 or 10. Never the video-game damage number.");

/**
 * `type` e não `interface`: só o alias ganha index signature implícita, e sem
 * ela a linha não é atribuível a `Row` (`Record<string, unknown>`). Interface
 * aqui obrigaria a um cast em cada retorno.
 */
type LinhaGolpe = {
  pokemon_id: number;
  move_type: string;
  attack_name: string;
  game_power: number;
};

/** Lê o golpe de um tipo, já resolvendo o slug. */
async function lerGolpe(slug: string, tipo: string): Promise<LinhaGolpe> {
  const id = await resolverPokemon(slug);
  const { data, error } = await db
    .from("pokemon_moves")
    .select("pokemon_id, move_type, attack_name, game_power")
    .eq("pokemon_id", id)
    .eq("move_type", tipo.toLowerCase().trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new OperationError(
      "not_found",
      `${slug} has no ${tipo} move. Only one move per type exists, by game rule.`,
    );
  }
  return data as LinhaGolpe;
}

const updateMovePower: OperationDef<{
  pokemon_slug: string;
  move_type: string;
  game_power: number;
}> = {
  kind: "update_move_power",
  description:
    "Change the board-game value of a Pokémon's attack of a given type. " +
    "Use when the request is about how strong an attack is.",
  schema: z.object({
    pokemon_slug: z.string().min(1).describe("Lowercase slug, e.g. 'charizard'"),
    move_type: z.string().min(1).describe("Attack type, e.g. 'fire'"),
    game_power: gamePower,
  }),
  reindexesRag: false,

  read: (a) => lerGolpe(a.pokemon_slug, a.move_type),
  project: (a, before) => ({ ...before, game_power: a.game_power }),

  async apply(a) {
    const id = await resolverPokemon(a.pokemon_slug);
    const { data, error } = await db
      .from("pokemon_moves")
      .update({ game_power: a.game_power })
      .eq("pokemon_id", id)
      .eq("move_type", a.move_type.toLowerCase().trim())
      .select("pokemon_id, move_type, attack_name, game_power")
      .single();

    if (error) throw new Error(error.message);
    return data as Row;
  },

  invert: (a, before) => ({
    kind: "update_move_power",
    args: {
      pokemon_slug: a.pokemon_slug,
      move_type: a.move_type,
      game_power: before.game_power,
    },
  }),

  summary: (a) =>
    `Set ${a.pokemon_slug}'s ${a.move_type} attack value to ${a.game_power}`,
};

const renameMove: OperationDef<{
  pokemon_slug: string;
  move_type: string;
  attack_name: string;
}> = {
  kind: "rename_move",
  description:
    "Change the name of a Pokémon's attack of a given type, keeping its value. " +
    "Use when the request is about what the attack is called.",
  schema: z.object({
    pokemon_slug: z.string().min(1),
    move_type: z.string().min(1),
    attack_name: z.string().min(1).max(60).describe("New attack name, e.g. 'heat-wave'"),
  }),
  reindexesRag: false,

  read: (a) => lerGolpe(a.pokemon_slug, a.move_type),
  project: (a, before) => ({ ...before, attack_name: a.attack_name }),

  async apply(a) {
    const id = await resolverPokemon(a.pokemon_slug);
    const { data, error } = await db
      .from("pokemon_moves")
      .update({ attack_name: a.attack_name.trim() })
      .eq("pokemon_id", id)
      .eq("move_type", a.move_type.toLowerCase().trim())
      .select("pokemon_id, move_type, attack_name, game_power")
      .single();

    if (error) throw new Error(error.message);
    return data as Row;
  },

  invert: (a, before) => ({
    kind: "rename_move",
    args: {
      pokemon_slug: a.pokemon_slug,
      move_type: a.move_type,
      attack_name: before.attack_name,
    },
  }),

  summary: (a) => `Rename ${a.pokemon_slug}'s ${a.move_type} attack to "${a.attack_name}"`,
};

const updateTalentText: OperationDef<{
  type: string;
  talent_name: string;
  description: string;
}> = {
  kind: "update_talent_text",
  description:
    "Rewrite the description of a type talent (a type ability any Pokémon of " +
    "that type can acquire). Use when the request is about what a talent does.",
  schema: z.object({
    type: z.string().min(1).describe("Talent type, e.g. 'grass'"),
    talent_name: z.string().min(1).describe("Current talent name — it is not changed"),
    description: z.string().min(1).max(400).describe("New description text"),
  }),
  // Prosa: o chunk que menciona este talento fica desatualizado no índice.
  reindexesRag: true,

  async read(a) {
    const { data, error } = await db
      .from("type_talents")
      .select("id, type, name, description, position")
      .eq("type", a.type.toLowerCase().trim())
      .ilike("name", a.talent_name.trim())
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) {
      throw new OperationError(
        "not_found",
        `No "${a.talent_name}" talent for type ${a.type}.`,
      );
    }
    return data as Row;
  },

  project: (a, before) => ({ ...before, description: a.description }),

  async apply(a) {
    // Reusa o read para chegar ao id: a chave de negócio é (type, name), mas
    // escrever por id evita depender do `ilike` casar igual nas duas idas.
    const antes = (await updateTalentText.read(a)) as { id: number };
    const { data, error } = await db
      .from("type_talents")
      .update({ description: a.description.trim() })
      .eq("id", antes.id)
      .select("id, type, name, description, position")
      .single();

    if (error) throw new Error(error.message);
    return data as Row;
  },

  invert: (a, before) => ({
    kind: "update_talent_text",
    args: {
      type: a.type,
      talent_name: a.talent_name,
      description: before.description,
    },
  }),

  summary: (a) => `Rewrite the ${a.type} talent "${a.talent_name}"`,
};

const updateAbilityText: OperationDef<{
  ability_name: string;
  description: string;
}> = {
  kind: "update_ability_text",
  description:
    "Rewrite the description of an innate ability (one a Pokémon already has). " +
    "Use when the request names an ability rather than a type talent.",
  schema: z.object({
    ability_name: z.string().min(1).describe("Current ability name, e.g. 'Blaze'"),
    description: z.string().min(1).max(400),
  }),
  reindexesRag: true,

  async read(a) {
    const { id } = await resolverHabilidade(a.ability_name);
    const { data, error } = await db
      .from("abilities")
      .select("id, key, name, description")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data as Row;
  },

  project: (a, before) => ({ ...before, description: a.description }),

  async apply(a) {
    const { id } = await resolverHabilidade(a.ability_name);
    const { data, error } = await db
      .from("abilities")
      .update({ description: a.description.trim() })
      .eq("id", id)
      .select("id, key, name, description")
      .single();

    if (error) throw new Error(error.message);
    return data as Row;
  },

  invert: (a, before) => ({
    kind: "update_ability_text",
    args: { ability_name: a.ability_name, description: before.description },
  }),

  summary: (a) => `Rewrite the innate ability "${a.ability_name}"`,
};

/* ── Registro ─────────────────────────────────────────────────────────────── */

export const operations = [
  updateMovePower,
  renameMove,
  updateTalentText,
  updateAbilityText,
] as OperationDef<any>[];

export const operationsByKind = new Map(operations.map((o) => [o.kind, o]));

/**
 * Valida uma proposta contra o registro.
 *
 * Único ponto de entrada de qualquer coisa vinda do modelo ou da rede — a
 * operação persistida em `change_requests.operation` volta por aqui antes de
 * ser aplicada. Reler do banco e confiar seria confiar em JSON gravado meses
 * atrás por uma versão anterior do cardápio.
 */
export function parseProposal(entrada: unknown): {
  op: OperationDef<any>;
  args: any;
  proposal: Proposal;
} {
  const base = z
    .object({ kind: z.string(), args: z.record(z.string(), z.unknown()) })
    .safeParse(entrada);

  if (!base.success) {
    throw new OperationError("invalid", "Proposal must be { kind, args }.");
  }

  const op = operationsByKind.get(base.data.kind);
  if (!op) {
    throw new OperationError(
      "invalid",
      `Unknown operation "${base.data.kind}". Known: ${[...operationsByKind.keys()].join(", ")}.`,
    );
  }

  const args = op.schema.safeParse(base.data.args);
  if (!args.success) {
    throw new OperationError(
      "invalid",
      `Invalid arguments for ${op.kind}: ${args.error.issues
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}`,
    );
  }

  return { op, args: args.data, proposal: { kind: op.kind, args: args.data } };
}

/** Campos que mudam entre duas versões da linha. Alimenta o diff da tela. */
export function diff(before: Row, after: Row): { field: string; from: unknown; to: unknown }[] {
  return Object.keys({ ...before, ...after })
    .filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]))
    .map((k) => ({ field: k, from: before[k], to: after[k] }));
}
