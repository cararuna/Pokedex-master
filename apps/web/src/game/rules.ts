/**
 * Regras do jogo de tabuleiro.
 *
 * Este arquivo é a fonte de verdade das mecânicas. Estava espalhado entre
 * `MovimentosCompletos.tsx` (conversão de poder), `PokemonMove.tsx` (tabela de
 * vantagens e mapa de ícones) e `useAddMoves.ts` (ajustes manuais).
 *
 * Na Fase 2 as tabelas viram registros no Supabase e o agente de IA consegue
 * consultá-las — hoje respondê-las exigiria ler o código-fonte.
 */

export const POKEMON_TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export type GameType = (typeof POKEMON_TYPES)[number];

export interface GameMove {
  attackName: string;
  moveType: GameType;
  /** Valor na escala do tabuleiro: 8, 9 ou 10. */
  power: number;
}

export interface GamePokemon {
  id: number;
  dexNumber: number;
  slug: string;
  types: GameType[];
  abilities: string[];
  sprites: Record<string, string | null>;
  /** No máximo um golpe por tipo — o mais forte. */
  moves: GameMove[];
}

/**
 * Conversão do dano da série para a escala do tabuleiro.
 *
 *   ceil(poder / 10) · teto 10 · qualquer valor ≤ 7 vira 8
 *
 * O resultado é sempre 8, 9 ou 10. A compressão é intencional: no tabuleiro o
 * valor vira dificuldade de rolagem, e uma faixa de 1 a 10 tornaria a maioria
 * dos ataques irrelevante. Concentrar em três degraus mantém toda escolha viva.
 */
export function toGamePower(power: number): number {
  let value = Math.ceil(power / 10);
  if (value > 10) value = 10;
  if (value <= 7) value = 8;
  return value;
}

/**
 * Vantagens de tipo — o que cada tipo de ataque acerta com bônus.
 *
 * É a tabela do jogo, não a da série: `ghost` aqui também acerta `ghost`, e
 * não existem entradas para `normal`, que não tem vantagem contra nada.
 */
export const TYPE_ADVANTAGES: Partial<Record<GameType, GameType[]>> = {
  grass: ["water", "rock", "ground"],
  fire: ["grass", "bug", "ice", "steel"],
  dragon: ["dragon"],
  steel: ["fairy", "rock", "ice"],
  dark: ["ghost", "psychic"],
  ghost: ["ghost", "psychic"],
  flying: ["fighting", "bug", "grass"],
  water: ["fire", "rock", "ground"],
  bug: ["dark", "psychic", "grass"],
  psychic: ["fighting", "poison"],
  poison: ["fairy", "grass"],
  electric: ["water", "flying"],
  ground: ["electric", "poison", "steel", "fire", "rock"],
  fighting: ["dark", "normal", "steel", "ice", "rock"],
  fairy: ["dark", "fighting", "dragon"],
  ice: ["dragon", "grass", "flying", "ground"],
  rock: ["fire", "ice", "flying", "bug"],
};

export function getAdvantages(type: GameType): GameType[] {
  return TYPE_ADVANTAGES[type] ?? [];
}

/**
 * Os símbolos de tipagem mudaram de casa: agora são `TypeIcon`, do design
 * system. Ficavam aqui como caminho para `public/`, o que os tornava
 * invisíveis para o Storybook e para as previews — a vitrine mostrava um
 * ponto de cor enquanto o produto mostrava o símbolo do tabuleiro.
 */

/** Rótulo exibido. A chave permanece em inglês, como na PokeAPI. */
export const TYPE_LABELS: Record<GameType, string> = {
  normal: "Normal",
  fire: "Fire",
  water: "Water",
  grass: "Grass",
  electric: "Electric",
  ice: "Ice",
  fighting: "Fighting",
  poison: "Poison",
  ground: "Ground",
  flying: "Flying",
  psychic: "Psychic",
  bug: "Bug",
  rock: "Rock",
  ghost: "Ghost",
  dragon: "Dragon",
  dark: "Dark",
  steel: "Steel",
  fairy: "Fairy",
};

/** Gerações de arte disponíveis, na ordem do seletor da tela. */
export const SPRITE_SETS = [
  { key: "generation-i", label: "Gen. I" },
  { key: "generation-ii", label: "Gen. II" },
  { key: "generation-iii", label: "Gen. III" },
  { key: "generation-iv", label: "Gen. IV" },
  { key: "generation-v", label: "Gen. V" },
  { key: "icons", label: "Icons" },
  { key: "3d", label: "3D" },
  { key: "artwork", label: "Artwork" },
] as const;

export function formatMoveName(slug: string): string {
  return slug
    .split(/[-\s]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function formatName(slug: string): string {
  return formatMoveName(slug);
}
