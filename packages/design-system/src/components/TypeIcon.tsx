import type { PokemonType } from "./TypeChip";

import bug from "../assets/types/bugType.png";
import dark from "../assets/types/darkType.png";
import dragon from "../assets/types/dragonType.png";
import electric from "../assets/types/electricType.png";
import fairy from "../assets/types/fairyType.png";
import fighting from "../assets/types/fightingType.png";
import fire from "../assets/types/fireType.png";
import flying from "../assets/types/flyingType.png";
import ghost from "../assets/types/ghostType.png";
import grass from "../assets/types/grassType.png";
import ground from "../assets/types/groundType.png";
import ice from "../assets/types/iceType.png";
import normal from "../assets/types/normalType.png";
import poison from "../assets/types/poisonType.png";
import psychic from "../assets/types/psychicType.png";
import rock from "../assets/types/rockType.png";
import steel from "../assets/types/steelType.png";
import water from "../assets/types/waterType.png";

/**
 * Símbolo de tipagem do jogo de tabuleiro.
 *
 * ── Por que estes PNG moram no design system ────────────────────────────
 *
 * Porque **são** o design system. São as mesmas imagens das cartas físicas do
 * jogo, identidade anterior ao sistema — o sistema governa cor, espaço e forma
 * ao redor, e acomoda o símbolo; nunca o contrário. Trocá-los por um ícone
 * genérico descaracterizaria o produto.
 *
 * Ficaram em `apps/web/public/` por um tempo, e o custo apareceu na vitrine: o
 * Storybook e as previews mostravam um chip colorido com o nome do tipo,
 * enquanto o produto mostrava o símbolo. Duas aparências, e só uma era
 * verdade. Assets em `public/` são servidos por caminho absoluto e não existem
 * para nenhum outro pacote — trazê-los para cá é o que torna a vitrine capaz
 * de mostrar o componente real.
 *
 * Import estático, e não `/fireType.png`: assim o empacotador resolve, gera
 * hash no nome e o arquivo faltando vira erro de build em vez de imagem
 * quebrada em produção — que já aconteceu, por diferença de maiúscula entre
 * Windows e o servidor.
 */

const SIMBOLOS: Record<PokemonType, string> = {
  normal, fire, water, grass, electric, ice, fighting, poison, ground,
  flying, psychic, bug, rock, ghost, dragon, dark, steel, fairy,
};

/** Rótulo textual, para quando o símbolo não é decorativo. */
const NOMES: Record<PokemonType, string> = {
  normal: "Normal", fire: "Fire", water: "Water", grass: "Grass",
  electric: "Electric", ice: "Ice", fighting: "Fighting", poison: "Poison",
  ground: "Ground", flying: "Flying", psychic: "Psychic", bug: "Bug",
  rock: "Rock", ghost: "Ghost", dragon: "Dragon", dark: "Dark",
  steel: "Steel", fairy: "Fairy",
};

export interface TypeIconProps {
  type: PokemonType;
  /** Lado do quadrado, em pixels. */
  size?: number;
  /**
   * Decorativo por padrão.
   *
   * Numa linha de golpe o nome do tipo já está no texto ao lado, e um `alt`
   * repetiria a informação — o leitor de tela anunciaria tudo duas vezes.
   * Passe `decorative={false}` quando o símbolo for a única pista do tipo.
   */
  decorative?: boolean;
  className?: string;
}

export function TypeIcon({
  type,
  size = 16,
  decorative = true,
  className,
}: TypeIconProps) {
  return (
    <img
      src={SIMBOLOS[type]}
      alt={decorative ? "" : NOMES[type]}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      loading="lazy"
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
