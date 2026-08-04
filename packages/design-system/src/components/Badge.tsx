import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Badge — rótulo curto de estado ou categoria.
 *
 * Diferença para o TypeChip: o Badge é genérico e usa a paleta semântica
 * (sucesso, alerta, perigo); o TypeChip é de domínio e usa a paleta de tipos
 * elementais. São dois componentes de propósito, e não um só com prop `kind`:
 * o dia em que o tipo elemental ganhar ícone ou tooltip, um Badge genérico
 * não deveria herdar isso.
 *
 * Badge não é clicável. Se precisa de clique, é Button ou Chip removível —
 * um `<span>` com onClick não recebe foco nem responde a Enter.
 */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "highlight" | "success" | "warning" | "danger" | "info";
  variant?: "soft" | "solid" | "outline";
  size?: "sm" | "md";
  /** Ponto de cor à esquerda. Reforça o estado sem depender só da cor de fundo. */
  dot?: boolean;
}

const TONE_CLASSES: Record<
  NonNullable<BadgeProps["tone"]>,
  Record<NonNullable<BadgeProps["variant"]>, string>
> = {
  neutral: {
    soft: "bg-surface-sunken text-text-muted border-transparent",
    solid: "bg-surface-inverse text-text-inverse border-transparent",
    outline: "bg-transparent text-text-muted border-border-strong",
  },
  accent: {
    soft: "bg-accent-soft text-accent-text border-transparent",
    solid: "bg-accent-solid text-text-on-solid border-transparent",
    outline: "bg-transparent text-accent-text border-accent-border",
  },
  highlight: {
    soft: "bg-highlight-soft text-highlight-text border-transparent",
    solid: "bg-highlight-solid text-text-on-solid border-transparent",
    outline: "bg-transparent text-highlight-text border-highlight-border",
  },
  success: {
    soft: "bg-success-soft text-success-text border-transparent",
    solid: "bg-success-solid text-text-on-solid border-transparent",
    outline: "bg-transparent text-success-text border-success-solid",
  },
  warning: {
    soft: "bg-warning-soft text-warning-text border-transparent",
    solid: "bg-warning-solid text-text-on-solid border-transparent",
    outline: "bg-transparent text-warning-text border-warning-solid",
  },
  danger: {
    soft: "bg-danger-soft text-danger-text border-transparent",
    solid: "bg-danger-solid text-text-on-solid border-transparent",
    outline: "bg-transparent text-danger-text border-danger-solid",
  },
  info: {
    soft: "bg-info-soft text-info-text border-transparent",
    solid: "bg-info-solid text-text-on-solid border-transparent",
    outline: "bg-transparent text-info-text border-info-solid",
  },
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = "neutral", variant = "soft", size = "md", dot = false, className, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center shrink-0 border",
        "font-sans font-medium",
        "rounded-[var(--chip-radius)]",
        size === "sm"
          ? "h-5 gap-1 px-1.5 text-[length:var(--fs-2xs)]"
          : "h-[var(--chip-height)] gap-1.5 px-[var(--chip-padding-x)] text-[length:var(--fs-xs)]",
        TONE_CLASSES[tone][variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current opacity-70"
        />
      )}
      {children}
    </span>
  );
});
