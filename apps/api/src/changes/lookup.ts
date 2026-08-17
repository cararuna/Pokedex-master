import { db } from "../db/client.js";

/**
 * Consulta de alvos, para o propositor se aterrar antes de propor.
 *
 * Sem isto o propositor era extração pura: via o seu texto e o cardápio, e
 * nada mais. Quando o pedido descrevia o alvo pelo **efeito** — "a habilidade
 * do dia ensolarado" — ele não tinha como saber o nome, e chutava.
 *
 * A distinção que o retrieval resolve de graça é justamente a que a mesa usa:
 *
 *   innate ability   o Pokémon já tem      → tabela `abilities`
 *   type talent      qualquer um do tipo   → tabela `type_talents`
 *
 * Perguntar ao modelo "isto é inata ou de tipo?" era pedir que ele adivinhasse
 * uma classificação que o banco já sabe. Aqui cada candidato volta dizendo de
 * qual mecanismo é, e a escolha da operação deixa de ser palpite.
 */

export type Mecanismo = "innate" | "type";

export interface Candidato {
  mechanism: Mecanismo;
  name: string;
  description: string;
  /** Só para talentos de tipo — a operação precisa dele para endereçar. */
  type?: string;
  /** Quais Pokémon têm esta habilidade inata. Ajuda a desempatar. */
  pokemon?: string[];
}

/* ── Busca ────────────────────────────────────────────────────────────────── */

/**
 * Tudo que um Pokémon pode ter: inatas dele, talentos dos tipos dele.
 *
 * É a consulta precisa, e cobre o caso comum — o pedido quase sempre nomeia o
 * Pokémon. Oito linhas em média, o que cabe no prompt sem pesar.
 */
async function porPokemon(slug: string): Promise<Candidato[]> {
  const { data: p } = await db
    .from("pokemon")
    .select("slug, types")
    .eq("slug", slug.toLowerCase().trim())
    .maybeSingle();

  if (!p) return [];
  const pokemon = p as { slug: string; types: string[] };

  const [inatas, talentos] = await Promise.all([
    db
      .from("pokemon_abilities")
      .select("abilities(name, description)")
      .eq("pokemon_slug", pokemon.slug)
      .order("position"),
    db
      .from("type_talents")
      .select("type, name, description, position")
      .in("type", pokemon.types)
      .order("position"),
  ]);

  return [
    ...((inatas.data ?? []) as any[])
      .map((r) => r.abilities)
      .filter(Boolean)
      .map((a: any): Candidato => ({
        mechanism: "innate",
        name: a.name,
        description: a.description,
        pokemon: [pokemon.slug],
      })),
    ...((talentos.data ?? []) as any[]).map(
      (t): Candidato => ({
        mechanism: "type",
        name: t.name,
        description: t.description,
        type: t.type,
      }),
    ),
  ];
}

/**
 * Busca por texto em nome e descrição, nas duas tabelas.
 *
 * Serve ao pedido que não nomeia Pokémon — "o talento que remove status". É
 * `ilike` e não busca vetorial de propósito: o índice de `banco://regras`
 * existe, mas seus chunks agrupam uma seção inteira ("Talentos do tipo fire"),
 * e o que se precisa aqui é a **linha**, com nome e tabela exatos. Vetor
 * devolveria o parágrafo certo sem dizer qual das três linhas dele é o alvo.
 *
 * RAG continua sendo a ferramenta para responder em prosa; para endereçar uma
 * linha, quem responde é a tabela.
 */
async function porTexto(termo: string): Promise<Candidato[]> {
  const alvo = `%${termo.trim()}%`;

  const [inatas, talentos] = await Promise.all([
    db
      .from("abilities")
      .select("name, description")
      .or(`name.ilike.${alvo},description.ilike.${alvo}`)
      .limit(12),
    db
      .from("type_talents")
      .select("type, name, description")
      .or(`name.ilike.${alvo},description.ilike.${alvo}`)
      .limit(12),
  ]);

  return [
    ...((inatas.data ?? []) as any[]).map(
      (a): Candidato => ({ mechanism: "innate", name: a.name, description: a.description }),
    ),
    ...((talentos.data ?? []) as any[]).map(
      (t): Candidato => ({
        mechanism: "type",
        name: t.name,
        description: t.description,
        type: t.type,
      }),
    ),
  ];
}

export interface ConsultaDeAlvo {
  pokemon?: string;
  contains?: string;
}

/**
 * Os dois modos combinados.
 *
 * Com `pokemon` **e** `contains`, filtra os candidatos daquele Pokémon pelo
 * texto — que é o caso mais preciso possível e o que o modelo deve preferir.
 * O filtro roda em memória sobre oito linhas; ir ao banco de novo seria uma
 * viagem para economizar nada.
 */
export async function consultarAlvos(consulta: ConsultaDeAlvo): Promise<Candidato[]> {
  if (!consulta.pokemon && !consulta.contains) return [];

  let achados = consulta.pokemon
    ? await porPokemon(consulta.pokemon)
    : await porTexto(consulta.contains!);

  if (consulta.pokemon && consulta.contains) {
    const termo = consulta.contains.toLowerCase();
    const filtrados = achados.filter(
      (c) =>
        c.name.toLowerCase().includes(termo) ||
        c.description.toLowerCase().includes(termo),
    );
    // Filtro que zera não ajuda ninguém: melhor devolver as oito do Pokémon e
    // deixar o modelo ver que nenhuma casa, do que devolver lista vazia e ele
    // concluir que o Pokémon não tem habilidade nenhuma.
    if (filtrados.length > 0) achados = filtrados;
  }

  return achados;
}

/** Como o candidato aparece para quem vai escolher na tela. */
export function rotularCandidato(c: Candidato): string {
  return c.mechanism === "innate"
    ? `${c.name} — innate ability`
    : `${c.name} — ${c.type} type talent`;
}
