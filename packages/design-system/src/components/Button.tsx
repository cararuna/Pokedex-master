import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Button — o componente que fixa os padrões do sistema.
 *
 * Tamanho, anel de foco e transição saem dos tokens `--control-*`, os mesmos
 * que Input e Select consomem. É por isso que um botão e um campo lado a lado
 * têm exatamente a mesma altura, sem ninguém ter medido nada.
 *
 * Cinco variantes, cada uma com um papel definido:
 *
 *   solid    ação principal — no máximo uma por tela
 *   soft     ação secundária frequente; presente sem competir com a solid
 *   outline  ação secundária em superfície densa, onde fundo pesaria
 *   ghost    ação terciária, barra de ferramentas, ícone
 *   danger   destrutiva — cor própria, nunca a solid vermelha
 *
 * Não existe variante "link": link é `<a>`. Botão que navega e link que
 * dispara ação quebram atalho de teclado, menu de contexto e leitor de tela.
 */
const button = cva(
  [
    "inline-flex items-center justify-center",
    "font-sans whitespace-nowrap select-none",
    "border border-transparent",
    "cursor-pointer",
    "transition-[background-color,border-color,color,box-shadow]",
    "duration-[130ms] ease-out",
    // O anel vem do token compartilhado — mesmo desenho em todo componente focável.
    "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
    // `pointer-events-none` no disabled evita o hover disparar em elemento inerte.
    "disabled:pointer-events-none disabled:opacity-45",
    // Ícone dentro do botão não deve encolher quando o rótulo é longo.
    "[&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        solid: [
          "bg-accent-solid text-text-on-solid",
          "hover:bg-accent-solid-hover",
          "active:bg-accent-solid-active",
        ],
        soft: [
          "bg-accent-soft text-accent-text border-transparent",
          "hover:bg-accent-soft-hover",
        ],
        outline: [
          "bg-transparent text-text border-border-strong",
          "hover:bg-surface-hover hover:border-border-interactive",
        ],
        ghost: [
          "bg-transparent text-text-muted",
          "hover:bg-surface-hover hover:text-text",
        ],
        danger: [
          "bg-danger-solid text-text-on-solid",
          "hover:brightness-110 active:brightness-95",
        ],
      },
      size: {
        sm: "h-[var(--control-height-sm)] px-[var(--control-padding-x-sm)] gap-[var(--control-gap-sm)] text-[length:var(--control-font-size-sm)] rounded-[var(--control-radius)] [&_svg]:size-3.5",
        md: "h-[var(--control-height-md)] px-[var(--control-padding-x-md)] gap-[var(--control-gap-md)] text-[length:var(--control-font-size-md)] rounded-[var(--control-radius)] [&_svg]:size-4",
        lg: "h-[var(--control-height-lg)] px-[var(--control-padding-x-lg)] gap-[var(--control-gap-lg)] text-[length:var(--control-font-size-lg)] rounded-[var(--control-radius)] [&_svg]:size-[1.125rem]",
      },
      /** Quadrado, para botão só de ícone. Garante alvo de toque adequado. */
      iconOnly: {
        true: "px-0 aspect-square",
        false: "",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
      iconOnly: false,
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  /**
   * Renderiza no elemento filho em vez de num `<button>`.
   * Uso: envolver um `<a>` ou um `<Link>` mantendo a aparência de botão,
   * sem aninhar âncora dentro de botão (HTML inválido).
   */
  asChild?: boolean;
  /** Mostra spinner, desabilita e anuncia o estado a leitores de tela. */
  loading?: boolean;
  /** Ícone antes do rótulo. */
  startIcon?: React.ReactNode;
  /** Ícone depois do rótulo. */
  endIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      iconOnly,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      startIcon,
      endIcon,
      children,
      ...props
    },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        className={cn(button({ variant, size, iconOnly, fullWidth }), className)}
        disabled={isDisabled}
        // `aria-busy` avisa o leitor de tela que a ação está em curso.
        // Sem isso, o spinner é uma informação exclusivamente visual.
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Spinner /> : startIcon}
        {children}
        {!loading && endIcon}
      </Comp>
    );
  },
);

/**
 * Spinner interno. `currentColor` faz ele herdar a cor da variante —
 * um único desenho serve para as cinco.
 */
function Spinner() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="animate-spin"
    >
      <circle
        cx="8"
        cy="8"
        r="6.5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { button as buttonVariants };
