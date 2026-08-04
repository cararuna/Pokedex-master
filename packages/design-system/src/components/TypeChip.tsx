import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * TypeChip — identifica o tipo elemental de um Pokémon ou golpe.
 *
 * Substitui o esquema antigo, em que cada tipo tinha uma regra de CSS própria
 * com `border: 24px solid`, `background-color` e `box-shadow` — dezoito blocos
 * quase idênticos, ~600 linhas, e a cor inundando o cartão inteiro.
 *
 * Aqui o tipo entra como *dado*, não como classe: a cor sai de
 * `--color-type-{tipo}`, resolvido no CSS. Acrescentar um tipo novo é uma
 * linha de token, não um bloco novo de estilo.
 *
 * Sobre a escolha visual: a variante padrão é `soft` — pigmento sobre papel,
 * não bloco chapado. Numa grade de 300 cartões com dois tipos cada, chip
 * sólido vira ruído; o olho perde o nome do Pokémon, que é a informação
 * principal.
 */

export const POKEMON_TYPES = [
  "normal", "fire", "water", "grass", "electric", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

/**
 * Rótulo exibido para cada tipo.
 *
 * A tabela existe mesmo sendo quase idêntica à chave: o rótulo é texto de
 * interface e pode mudar; a chave é o identificador da PokeAPI e do banco, e
 * não muda. Colapsar os dois num `capitalize` amarraria a tela ao formato do
 * dado — e o primeiro tipo com nome composto quebraria a regra.
 */
const TYPE_LABELS: Record<PokemonType, string> = {
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

export interface TypeChipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  type: PokemonType;
  /**
   * soft   pigmento sobre papel — padrão, para uso em grade
   * solid  chapado — para quando o tipo é a informação principal
   * outline apenas contorno — para superfície já muito colorida
   */
  variant?: "soft" | "solid" | "outline";
  size?: "sm" | "md";
  /** Oculta o texto e mantém só o ponto de cor. O nome vai para o aria-label. */
  iconOnly?: boolean;
  /**
   * Substitui o ponto de cor por um símbolo próprio.
   *
   * Existe porque este produto tem identidade visual anterior ao design
   * system: os ícones de tipagem são os mesmos das cartas físicas do jogo de
   * tabuleiro. O sistema acomoda esse símbolo em vez de apagá-lo — o token de
   * cor continua governando fundo, borda e texto.
   */
  icon?: React.ReactNode;
}

export const TypeChip = forwardRef<HTMLSpanElement, TypeChipProps>(
  function TypeChip(
    { type, variant = "soft", size = "md", iconOnly = false, icon, className, ...props },
    ref,
  ) {
    const label = TYPE_LABELS[type];

    return (
      <span
        ref={ref}
        // A cor do tipo entra por custom property local. Os estilos abaixo
        // referenciam --type, então o mesmo CSS serve para os 18 tipos.
        style={
          { "--type": `var(--color-type-${type})` } as React.CSSProperties
        }
        className={cn(
          "inline-flex items-center justify-center shrink-0",
          "font-sans font-medium uppercase",
          "tracking-[var(--chip-tracking)]",
          "rounded-[var(--chip-radius)]",
          "border",
          size === "sm"
            ? "h-5 gap-1 px-1.5 text-[length:var(--fs-2xs)]"
            : "h-[var(--chip-height)] gap-1.5 px-[var(--chip-padding-x)] text-[length:var(--chip-font-size)]",
          iconOnly && "aspect-square px-0",
          variant === "solid" && "bg-[var(--type)] border-transparent text-text-on-solid",
          // `color-mix` produz a versão suave a partir da mesma cor base, em vez
          // de exigir um segundo token por tipo — 18 tokens em vez de 36.
          variant === "soft" && [
            "bg-[color-mix(in_oklab,var(--type)_14%,transparent)]",
            "border-[color-mix(in_oklab,var(--type)_24%,transparent)]",
            "text-[color-mix(in_oklab,var(--type)_82%,var(--text))]",
          ],
          variant === "outline" && "bg-transparent border-[var(--type)] text-[var(--type)]",
          className,
        )}
        // Sem texto visível, o nome do tipo precisa existir para leitor de tela.
        aria-label={iconOnly ? label : undefined}
        {...props}
      >
        {icon ?? (
          <span
            aria-hidden="true"
            className={cn(
              "rounded-full bg-[var(--type)]",
              size === "sm" ? "size-1.5" : "size-2",
              variant === "solid" && "bg-current opacity-70",
            )}
          />
        )}
        {!iconOnly && label}
      </span>
    );
  },
);

/** Rótulo em português de um tipo. Útil fora do chip (filtro, legenda). */
export function getTypeLabel(type: PokemonType): string {
  return TYPE_LABELS[type];
}
