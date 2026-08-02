import { z } from "zod";
import { db } from "../../db/client";

/**
 * Registro de ferramentas.
 *
 * Cada ferramenta declara o schema dos argumentos em Zod. Uma definição só
 * serve a dois propósitos: descreve a função para o modelo (convertida em
 * JSON Schema) e **valida** o que ele devolveu antes de executar. Sem essa
 * validação, um argumento alucinado vira uma query malformada ou pior.
 *
 * Decisão de arquitetura, e é a que mais rende numa conversa técnica:
 *
 *   dado estruturado  →  ferramenta com SQL
 *   texto livre       →  RAG
 *
 * Pokémon, golpes e valores do jogo são tabelas. Perguntar "quem bate 10 de
 * fogo" a um índice vetorial devolveria os chunks mais parecidos com a
 * pergunta — não a resposta certa. Vetor não conta, não ordena e não compara.
 * RAG fica para a documentação, que é texto de verdade (Fase 5).
 */

export interface Tool<TArgs = any> {
  name: string;
  description: string;
  schema: z.ZodType<TArgs>;
  execute: (args: TArgs) => Promise<unknown>;
}

/* ── Consultas de domínio ─────────────────────────────────────────────────── */

const buscarPokemon: Tool = {
  name: "buscar_pokemon",
  description:
    "Busca Pokémon do jogo por nome, tipo do Pokémon ou tipo de ataque que ele aprende. " +
    "Use quando a pergunta for sobre QUAIS Pokémon atendem a um critério. " +
    "Para saber quem aprende ataque de um tipo, use tipo_de_ataque — não tipo_do_pokemon.",
  schema: z.object({
    nome: z.string().optional().describe("Trecho do nome, ex.: 'char'"),
    tipo_do_pokemon: z
      .string()
      .optional()
      .describe("Tipo do próprio Pokémon, ex.: 'fire'"),
    tipo_de_ataque: z
      .string()
      .optional()
      .describe("Tipo do ataque que ele aprende, ex.: 'fire'"),
    poder_minimo: z
      .number()
      .min(8)
      .max(10)
      .optional()
      .describe("Valor mínimo do ataque na escala do jogo (8, 9 ou 10)"),
    limite: z.number().min(1).max(50).default(20),
  }),
  async execute(args) {
    // Com filtro por tipo de ataque, a consulta parte de pokemon_moves e sobe
    // para pokemon — assim o índice (move_type, game_power desc) é usado e a
    // ordenação por valor sai de graça.
    if (args.tipo_de_ataque) {
      let q = db
        .from("pokemon_moves")
        .select("attack_name, game_power, move_type, pokemon!inner(slug, dex_number, types)")
        .eq("move_type", args.tipo_de_ataque)
        .order("game_power", { ascending: false })
        .limit(args.limite);

      if (args.poder_minimo) q = q.gte("game_power", args.poder_minimo);
      if (args.nome) q = q.ilike("pokemon.slug", `%${args.nome}%`);
      if (args.tipo_do_pokemon) q = q.contains("pokemon.types", [args.tipo_do_pokemon]);

      const { data, error } = await q;
      if (error) throw new Error(error.message);

      return (data ?? []).map((r: any) => ({
        slug: r.pokemon.slug,
        numero: r.pokemon.dex_number,
        tipos: r.pokemon.types,
        ataque: r.attack_name,
        tipo_do_ataque: r.move_type,
        valor_no_jogo: r.game_power,
      }));
    }

    let q = db
      .from("pokemon")
      .select("slug, dex_number, types")
      .order("dex_number")
      .limit(args.limite);

    if (args.nome) q = q.ilike("slug", `%${args.nome}%`);
    if (args.tipo_do_pokemon) q = q.contains("types", [args.tipo_do_pokemon]);

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data;
  },
};

const fichaDoPokemon: Tool = {
  name: "ficha_do_pokemon",
  description:
    "Ficha completa de um Pokémon: tipos, todos os ataques com valor do jogo, " +
    "e habilidades inatas. Use quando a pergunta for sobre UM Pokémon específico.",
  schema: z.object({
    slug: z.string().describe("Identificador em minúsculas, ex.: 'charizard'"),
  }),
  async execute({ slug }) {
    const { data: p, error } = await db
      .from("pokemon")
      .select("id, slug, dex_number, types")
      .eq("slug", slug.toLowerCase())
      .maybeSingle();

    if (error) throw new Error(error.message);
    // Devolver um erro legível em vez de lançar: o modelo consegue se
    // recuperar sozinho, pedindo o nome certo à pessoa.
    if (!p) return { erro: `Nenhum Pokémon com slug "${slug}".` };

    const [{ data: golpes }, { data: habilidades }] = await Promise.all([
      db
        .from("pokemon_moves")
        .select("attack_name, move_type, game_power")
        .eq("pokemon_id", p.id)
        .order("game_power", { ascending: false }),
      db
        .from("pokemon_abilities")
        .select("position, abilities(name, description)")
        .eq("pokemon_slug", p.slug)
        .order("position"),
    ]);

    return {
      slug: p.slug,
      numero: p.dex_number,
      tipos: p.types,
      ataques: (golpes ?? []).map((g) => ({
        nome: g.attack_name,
        tipo: g.move_type,
        valor_no_jogo: g.game_power,
      })),
      habilidades_inatas: (habilidades ?? []).map((h: any) => h.abilities),
    };
  },
};

const vantagemDeTipo: Tool = {
  name: "vantagem_de_tipo",
  description:
    "Contra quais tipos um tipo de ataque tem vantagem. Esta é a tabela DO JOGO " +
    "DE TABULEIRO, que difere da série: 'ghost' também acerta 'ghost', e 'normal' " +
    "não tem vantagem contra nada. Sempre consulte em vez de responder de memória.",
  schema: z.object({
    tipo_de_ataque: z.string().describe("Ex.: 'fire'"),
  }),
  async execute({ tipo_de_ataque }) {
    const { data, error } = await db
      .from("type_advantages")
      .select("defending_type")
      .eq("attacking_type", tipo_de_ataque.toLowerCase());

    if (error) throw new Error(error.message);
    return {
      tipo_de_ataque,
      tem_vantagem_contra: (data ?? []).map((r) => r.defending_type),
    };
  },
};

const talentosDoTipo: Tool = {
  name: "talentos_do_tipo",
  description:
    "Árvore de talentos de um tipo — as habilidades que um Pokémon daquele tipo " +
    "pode adquirir no jogo de tabuleiro.",
  schema: z.object({ tipo: z.string() }),
  async execute({ tipo }) {
    const { data, error } = await db
      .from("type_talents")
      .select("name, description, position")
      .eq("type", tipo.toLowerCase())
      .order("position");

    if (error) throw new Error(error.message);
    return { tipo, talentos: data ?? [] };
  },
};

const regraDeConversao: Tool = {
  name: "explicar_regra_de_conversao",
  description:
    "Explica como o dano da série vira o valor do tabuleiro. Use quando " +
    "perguntarem por que um ataque vale 8, 9 ou 10.",
  schema: z.object({
    dano_da_serie: z
      .number()
      .optional()
      .describe("Se informado, mostra a conversão desse valor específico"),
  }),
  async execute({ dano_da_serie }) {
    const regra = {
      passos: [
        "Apenas golpes aprendidos por nível, com dano maior que zero",
        "valor = teto(dano ÷ 10)",
        "Se passar de 10, vira 10",
        "Se for 7 ou menos, vira 8",
        "De cada tipo fica só o golpe de maior valor",
      ],
      escala_final: [8, 9, 10],
      motivo:
        "O valor vira dificuldade de rolagem na mesa. Uma faixa de 1 a 10 " +
        "tornaria a maioria dos ataques irrelevante; três degraus mantêm " +
        "toda escolha viva.",
    };

    if (dano_da_serie === undefined) return regra;

    let v = Math.ceil(dano_da_serie / 10);
    if (v > 10) v = 10;
    if (v <= 7) v = 8;
    return { ...regra, exemplo: { dano_da_serie, valor_no_jogo: v } };
  },
};

/* ── Busca em texto livre ─────────────────────────────────────────────────── */

/**
 * A única ferramenta com RAG. Todas as outras são SQL.
 *
 * A separação é a decisão de arquitetura mais importante do agente: dado
 * estruturado tem ferramenta com SQL, texto livre tem RAG. Perguntar "quem
 * bate 10 de fogo" a um índice vetorial devolveria os trechos mais parecidos
 * com a frase — não a resposta. Vetor não conta, não ordena, não compara.
 */
const buscarDocumentacao: Tool = {
  name: "buscar_documentacao",
  description:
    "Busca em texto livre na documentação do projeto e nas descrições de " +
    "talentos e habilidades. Use para perguntas conceituais ou de regra em " +
    "prosa: 'como funciona a árvore de talentos', 'por que o valor é " +
    "comprimido', 'qual talento remove status', 'como o design system organiza " +
    "os tokens'. NÃO use para consultar Pokémon, ataques ou valores — para " +
    "isso existem as ferramentas de SQL, que são exatas.",
  schema: z.object({
    pergunta: z
      .string()
      .describe("A pergunta em linguagem natural, como a pessoa fez"),
    area: z
      .enum(["design-system", "arquitetura", "regras"])
      .optional()
      .describe("Restringe a busca. Omita quando estiver em dúvida."),
    limite: z.number().min(1).max(8).default(5),
  }),
  async execute({ pergunta, area, limite }) {
    const { buscarTrechos } = await import("../../rag/search");
    const trechos = await buscarTrechos(pergunta, { limite, kind: area ?? null });

    if (trechos.length === 0) {
      // Importante devolver isto explicitamente: a busca vetorial sempre traz
      // os k mais próximos, então "nada relevante" precisa ser dito, senão o
      // modelo assume que o vazio é a resposta.
      return {
        encontrado: false,
        aviso:
          "Nenhum trecho suficientemente relevante. Diga que não encontrou " +
          "na documentação em vez de deduzir.",
      };
    }

    return {
      encontrado: true,
      // Instrução no próprio resultado, e não só no system prompt: aqui ela
      // chega junto do dado, no momento em que o modelo decide o próximo passo.
      instrucao:
        "Responda com estes trechos. Se não cobrem a pergunta, diga o que " +
        "não está documentado — não refaça a busca com outra redação.",
      trechos: trechos.map((t) => ({
        // A fonte vai junto para a resposta poder citar de onde veio.
        fonte: t.heading_path ?? t.title,
        arquivo: t.path,
        similaridade: Number(t.similarity.toFixed(3)),
        // Truncado: cada trecho inteiro pode passar de 2.400 caracteres, e
        // como o histórico acumula, quatro buscas chegaram a 46k tokens numa
        // execução real. 1.200 preserva o argumento do parágrafo.
        conteudo:
          t.content.length > 1200 ? t.content.slice(0, 1200) + "…" : t.content,
      })),
    };
  },
};

export const tools: Tool[] = [
  buscarPokemon,
  fichaDoPokemon,
  vantagemDeTipo,
  talentosDoTipo,
  regraDeConversao,
  buscarDocumentacao,
];

export const toolsByName = new Map(tools.map((t) => [t.name, t]));
