import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Card — superfície que agrupa conteúdo relacionado.
 *
 * Composto por partes (`Card.Header`, `Card.Body`, `Card.Footer`) em vez de
 * receber props como `title` e `footer`. A diferença importa: com props, todo
 * caso novo vira uma prop nova (`titleIcon`, `titleBadge`, `headerAction`…) e
 * em pouco tempo o componente tem vinte props e nenhuma flexibilidade. Com
 * composição, o consumidor monta o que precisar e a API não cresce.
 *
 * Elevação: no tema claro a separação vem da sombra; no escuro, da borda —
 * sombra não produz contraste sobre fundo quase preto. Os tokens `--card-*`
 * já trocam sozinhos, o componente não sabe em qual tema está.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * flat        sem sombra — para cartão dentro de cartão, ou lista densa
   * raised      sombra sutil — padrão
   * interactive sombra + resposta ao hover; use quando o cartão inteiro é clicável
   */
  elevation?: "flat" | "raised" | "interactive";
  /** Reduz o respiro interno. Para grades densas. */
  compact?: boolean;
  asChild?: boolean;
}

const CardRoot = forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevation = "raised", compact = false, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col",
        "bg-[var(--card-bg)]",
        "border border-[var(--card-border)]",
        "rounded-[var(--card-radius)]",
        "transition-[box-shadow,border-color,transform]",
        "duration-[190ms] ease-out",
        elevation === "raised" && "shadow-[var(--card-shadow)]",
        elevation === "interactive" && [
          "shadow-[var(--card-shadow)]",
          "hover:shadow-[var(--card-shadow-hover)]",
          "hover:border-border-strong",
          // Deslocamento de 1px. Mais que isso lê como brinquedo; o objetivo
          // é sugerir que o cartão levantou do papel, não que ele pulou.
          "hover:-translate-y-px",
          // O anel precisa aparecer quando o foco está em algo *dentro* do
          // cartão — o alvo real costuma ser um link na área do título.
          "focus-within:[box-shadow:var(--focus-ring-shadow)]",
        ],
        className,
      )}
      data-compact={compact || undefined}
      {...props}
    />
  );
});

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-1",
          "p-[var(--card-padding)]",
          "group-data-[compact]:p-[var(--card-padding-compact)]",
          className,
        )}
        {...props}
      />
    );
  },
);

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn(
          "font-display text-lg font-semibold leading-snug tracking-tight text-text",
          className,
        )}
        {...props}
      />
    );
  },
);

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={cn("text-sm leading-normal text-text-muted", className)}
        {...props}
      />
    );
  },
);

const CardBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex-1 px-[var(--card-padding)] pb-[var(--card-padding)]",
          "[&:first-child]:pt-[var(--card-padding)]",
          className,
        )}
        {...props}
      />
    );
  },
);

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-2",
          "px-[var(--card-padding)] py-[var(--space-3)]",
          "border-t border-border-subtle",
          className,
        )}
        {...props}
      />
    );
  },
);

/**
 * Área de mídia. `overflow-hidden` + raio herdado evitam o canto quadrado da
 * imagem furando o canto arredondado do cartão.
 */
const CardMedia = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardMedia({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden",
          "rounded-t-[calc(var(--card-radius)-1px)]",
          "bg-surface-sunken",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Body: CardBody,
  Footer: CardFooter,
  Media: CardMedia,
});
