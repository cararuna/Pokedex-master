import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Skeleton — placeholder com a forma do conteúdo que está por vir.
 *
 * Substitui o spinner centralizado com a frase "Carregando Lista de Pokémons
 * e seus golpes...". A diferença não é estética: o spinner não informa nada
 * sobre o que virá e faz a página inteira saltar quando o conteúdo chega. O
 * skeleton ocupa o mesmo espaço do resultado, então não há deslocamento de
 * layout — e a espera parece menor porque a estrutura já está lá.
 *
 * Acessibilidade: o bloco é `aria-hidden`. Quem usa leitor de tela não ganha
 * nada ouvindo "carregando" doze vezes; quem anuncia o estado é o contêiner
 * da lista, com `aria-busy`.
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
  /** Número de linhas. Só para variant="text". */
  lines?: number;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton(
    { variant = "rect", width, height, lines = 1, className, style, ...props },
    ref,
  ) {
    const base = cn(
      "relative overflow-hidden",
      "bg-[var(--skeleton-base)]",
      // O brilho é um gradiente deslizando por cima, não uma troca de opacidade:
      // pulsar o bloco inteiro cansa mais a vista numa grade com muitos itens.
      "after:absolute after:inset-0",
      "after:bg-gradient-to-r after:from-transparent after:via-[var(--skeleton-shine)] after:to-transparent",
      "after:animate-[skeleton-shine_1.6s_ease-in-out_infinite]",
      "motion-reduce:after:animate-none",
      variant === "circle" && "rounded-full",
      variant === "rect" && "rounded-[var(--r-md)]",
      variant === "text" && "rounded-[var(--r-xs)] h-[1em]",
    );

    if (variant === "text" && lines > 1) {
      return (
        <div
          ref={ref}
          aria-hidden="true"
          className={cn("flex flex-col gap-2", className)}
          {...props}
        >
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={base}
              // A última linha sai mais curta — parágrafo real termina no meio.
              style={{ width: i === lines - 1 ? "62%" : "100%" }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(base, className)}
        style={{ width, height, ...style }}
        {...props}
      />
    );
  },
);
