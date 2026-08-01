import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Primitivos de layout.
 *
 * Existem para que espaçamento venha do sistema em vez de `margin` avulsa
 * espalhada pelos componentes. Margem em componente é o que faz o mesmo
 * cartão ficar diferente conforme a tela onde foi colocado — o componente
 * não deveria opinar sobre a distância até o vizinho.
 *
 * A regra: quem posiciona é o contêiner, e o espaçamento é sempre `gap`.
 */

type SpaceToken = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

const GAP: Record<SpaceToken, string> = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
  16: "gap-16",
};

/**
 * Tipado sobre HTMLElement, e não HTMLDivElement, por causa do `as`: com
 * `<Stack as="ul">` o elemento é um `<ul>`, e handlers tipados para div não
 * são atribuíveis a li/ul. HTMLElement é o supertipo que serve aos dois.
 */
interface StackProps extends React.HTMLAttributes<HTMLElement> {
  gap?: SpaceToken;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  as?: "div" | "section" | "ul" | "li" | "nav";
}

/** Empilha na vertical. */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(
  { gap = 4, align = "stretch", justify = "start", as: Tag = "div", className, ...props },
  ref,
) {
  return (
    <Tag
      ref={ref as never}
      className={cn(
        "flex flex-col",
        GAP[gap],
        align === "start" && "items-start",
        align === "center" && "items-center",
        align === "end" && "items-end",
        align === "stretch" && "items-stretch",
        justify === "center" && "justify-center",
        justify === "end" && "justify-end",
        justify === "between" && "justify-between",
        className,
      )}
      {...props}
    />
  );
});

/** Alinha na horizontal. Quebra linha por padrão — evita estouro no mobile. */
export const Inline = forwardRef<HTMLElement, StackProps & { wrap?: boolean }>(
  function Inline(
    { gap = 2, align = "center", justify = "start", wrap = true, as: Tag = "div", className, ...props },
    ref,
  ) {
    return (
      <Tag
        ref={ref as never}
        className={cn(
          "flex flex-row",
          wrap && "flex-wrap",
          GAP[gap],
          align === "start" && "items-start",
          align === "center" && "items-center",
          align === "end" && "items-end",
          align === "stretch" && "items-stretch",
          justify === "center" && "justify-center",
          justify === "end" && "justify-end",
          justify === "between" && "justify-between",
          className,
        )}
        {...props}
      />
    );
  },
);

/** Centraliza e limita a largura da página. */
export const Container = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function Container({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          "max-w-[var(--container-max)]",
          "px-[var(--container-padding-mobile)] sm:px-[var(--container-padding)]",
          className,
        )}
        {...props}
      />
    );
  },
);

/**
 * Grade responsiva de cartões.
 *
 * Usa `auto-fill` com `minmax`: o número de colunas é calculado pelo CSS a
 * partir do espaço disponível. Não há um único breakpoint escrito à mão —
 * a grade se adapta a qualquer largura, inclusive as que ninguém previu.
 */
export const CardGrid = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardGrid({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "grid gap-[var(--grid-gap)]",
          "grid-cols-[repeat(auto-fill,minmax(var(--grid-card-min),1fr))]",
          className,
        )}
        {...props}
      />
    );
  },
);

/** Linha divisória. Decorativa por padrão — sai da árvore de acessibilidade. */
export const Divider = forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement> & { orientation?: "horizontal" | "vertical" }
>(function Divider({ orientation = "horizontal", className, ...props }, ref) {
  return (
    <hr
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "border-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
});
