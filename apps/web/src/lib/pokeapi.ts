/**
 * Cliente da PokeAPI.
 *
 * Substitui o carregamento da versão anterior, que em `MovimentosCompletos`
 * percorria a API inteira num laço e disparava um request por golpe de cada
 * Pokémon — cerca de 15.000 requisições a cada abertura da página, sem cache.
 *
 * Estratégia daqui:
 *
 *   índice      1 requisição, uma vez, com os 1025 nomes
 *   página      24 requisições, só do que está na tela, em paralelo
 *   filtro      1 requisição no endpoint /type, que já devolve a lista pronta
 *   detalhe     sob demanda, ao abrir a ficha
 *
 * Tudo memoizado em Map. Voltar uma página não refaz nada.
 *
 * Isto ainda é temporário: na Fase 2 os dados passam a vir do Supabase, já
 * normalizados, e o front faz **uma** chamada paginada. A estrutura abaixo já
 * antecipa esse formato para a troca ser só de implementação.
 */

const BASE = "https://pokeapi.co/api/v2";

export interface PokemonSummary {
  id: number;
  slug: string;
  name: string;
  sprite: string | null;
  types: string[];
}

export interface PokemonStat {
  label: string;
  value: number;
}

export interface PokemonMove {
  name: string;
  type: string;
  power: number | null;
  accuracy: number | null;
  damageClass: string;
}

export interface PokemonDetail extends PokemonSummary {
  height: number;
  weight: number;
  abilities: string[];
  stats: PokemonStat[];
}

/* ── Cache em memória ────────────────────────────────────────────────────── */

const indexCache: { entries: { slug: string; id: number }[] | null } = {
  entries: null,
};
const detailCache = new Map<string, PokemonDetail>();
const typeCache = new Map<string, Set<string>>();
const movesCache = new Map<string, PokemonMove[]>();

/* ── Tradução de rótulos ─────────────────────────────────────────────────── */

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "Ataque",
  defense: "Defesa",
  "special-attack": "Ataque Esp.",
  "special-defense": "Defesa Esp.",
  speed: "Velocidade",
};

/** `bulbasaur` → `Bulbasaur`, `mr-mime` → `Mr. Mime` */
export function formatName(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`PokeAPI respondeu ${response.status} em ${url}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Índice completo de nomes. Uma requisição, uma vez por sessão.
 *
 * O `id` sai da própria URL em vez de uma chamada extra — a PokeAPI devolve
 * `.../pokemon/25/`, e o número é a única informação que falta no índice.
 */
export async function fetchIndex(): Promise<{ slug: string; id: number }[]> {
  if (indexCache.entries) return indexCache.entries;

  const data = await getJson<{ results: { name: string; url: string }[] }>(
    `${BASE}/pokemon?limit=1025&offset=0`,
  );

  indexCache.entries = data.results.map((r) => ({
    slug: r.name,
    id: Number(r.url.split("/").filter(Boolean).pop()),
  }));

  return indexCache.entries;
}

/**
 * Slugs de um tipo. Uma requisição resolve o filtro inteiro.
 *
 * A alternativa seria baixar o detalhe dos 1025 para ler o campo `types` —
 * exatamente o erro da versão anterior.
 */
export async function fetchSlugsByType(type: string): Promise<Set<string>> {
  const cached = typeCache.get(type);
  if (cached) return cached;

  const data = await getJson<{ pokemon: { pokemon: { name: string } }[] }>(
    `${BASE}/type/${type}`,
  );

  const slugs = new Set(data.pokemon.map((p) => p.pokemon.name));
  typeCache.set(type, slugs);
  return slugs;
}

interface RawPokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string } }[];
  abilities: { ability: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
      home?: { front_default: string | null };
    };
  };
}

function toDetail(raw: RawPokemon): PokemonDetail {
  return {
    id: raw.id,
    slug: raw.name,
    name: formatName(raw.name),
    // Arte oficial em vez do sprite de 96px: é ilustração vetorial em alta,
    // que combina com a direção de catálogo. O pixel art fica como fallback.
    sprite:
      raw.sprites.other?.["official-artwork"]?.front_default ??
      raw.sprites.other?.home?.front_default ??
      raw.sprites.front_default,
    types: raw.types.map((t) => t.type.name),
    height: raw.height,
    weight: raw.weight,
    abilities: raw.abilities.map((a) => formatName(a.ability.name)),
    stats: raw.stats.map((s) => ({
      label: STAT_LABELS[s.stat.name] ?? formatName(s.stat.name),
      value: s.base_stat,
    })),
  };
}

export async function fetchPokemon(slug: string): Promise<PokemonDetail> {
  const cached = detailCache.get(slug);
  if (cached) return cached;

  const detail = toDetail(await getJson<RawPokemon>(`${BASE}/pokemon/${slug}`));
  detailCache.set(slug, detail);
  return detail;
}

/**
 * Detalhes de uma página. Em paralelo, mas só dos itens visíveis.
 *
 * `allSettled` em vez de `all`: um Pokémon com dado inconsistente na API não
 * pode derrubar a página inteira. O que falhar simplesmente não aparece.
 */
export async function fetchPage(slugs: string[]): Promise<PokemonDetail[]> {
  const results = await Promise.allSettled(slugs.map(fetchPokemon));
  return results
    .filter(
      (r): r is PromiseFulfilledResult<PokemonDetail> => r.status === "fulfilled",
    )
    .map((r) => r.value);
}

/**
 * Golpes aprendidos por nível, com tipo e poder.
 *
 * Este é o dado caro: exige uma requisição por golpe, porque a lista em
 * `/pokemon` traz só o nome. Por isso roda **sob demanda**, ao abrir a aba
 * de golpes de um Pokémon — e não para os 387 de uma vez, como antes.
 *
 * Na Fase 2 vira uma junção no banco e o custo desaparece.
 */
export async function fetchMoves(slug: string): Promise<PokemonMove[]> {
  const cached = movesCache.get(slug);
  if (cached) return cached;

  const raw = await getJson<{
    moves: {
      move: { name: string; url: string };
      version_group_details: { move_learn_method: { name: string } }[];
    }[];
  }>(`${BASE}/pokemon/${slug}`);

  const levelUp = raw.moves.filter((m) =>
    m.version_group_details.some(
      (d) => d.move_learn_method.name === "level-up",
    ),
  );

  // Teto de 24 golpes: além disso a tabela vira rolagem infinita e o custo
  // em requisições cresce sem trazer informação nova para a tela.
  const detailed = await Promise.allSettled(
    levelUp.slice(0, 24).map(async (m) => {
      const move = await getJson<{
        name: string;
        power: number | null;
        accuracy: number | null;
        type: { name: string };
        damage_class: { name: string };
      }>(m.move.url);

      return {
        name: formatName(move.name),
        type: move.type.name,
        power: move.power,
        accuracy: move.accuracy,
        damageClass: move.damage_class.name,
      };
    }),
  );

  const moves = detailed
    .filter((r): r is PromiseFulfilledResult<PokemonMove> => r.status === "fulfilled")
    .map((r) => r.value)
    .sort((a, b) => (b.power ?? 0) - (a.power ?? 0));

  movesCache.set(slug, moves);
  return moves;
}
