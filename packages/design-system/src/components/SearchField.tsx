import { forwardRef, useId } from "react";
import { cn } from "../lib/cn";

/**
 * SearchField — busca com rótulo, ícone e botão de limpar.
 *
 * O campo antigo era um `<input>` cru com um `placeholder` fazendo as vezes de
 * rótulo. Placeholder não é rótulo: some quando a pessoa começa a digitar
 * (some justamente quando ela pode ter esquecido o que estava preenchendo),
 * não é lido de forma confiável por leitor de tela e costuma ter contraste
 * insuficiente.
 *
 * Aqui o rótulo é um `<label>` de verdade, associado por `id`. Quando não faz
 * sentido visualmente, `hideLabel` o esconde só do olho — continua no DOM,
 * continua sendo anunciado.
 */

export interface SearchFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label: string;
  /** Esconde o rótulo visualmente, mantendo-o para tecnologia assistiva. */
  hideLabel?: boolean;
  /** Texto auxiliar sob o campo. */
  hint?: string;
  /** Mensagem de erro. Presente, marca o campo como inválido. */
  error?: string;
  size?: "sm" | "md" | "lg";
  /** Callback do botão de limpar. Ausente, o botão não aparece. */
  onClear?: () => void;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      label,
      hideLabel = false,
      hint,
      error,
      size = "md",
      onClear,
      className,
      id: idProp,
      value,
      disabled,
      ...props
    },
    ref,
  ) {
    // useId garante id único mesmo com vários campos na mesma tela — e é
    // estável entre servidor e cliente, ao contrário de Math.random().
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    const hasValue = value !== undefined && value !== "";
    const showClear = Boolean(onClear) && hasValue && !disabled;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label
          htmlFor={id}
          className={cn(
            "text-sm font-medium text-text",
            hideLabel && "sr-only",
          )}
        >
          {label}
        </label>

        <div className="relative flex items-center">
          <SearchIcon
            className={cn(
              "pointer-events-none absolute left-3 text-text-subtle",
              size === "sm" ? "size-3.5" : "size-4",
            )}
          />

          <input
            ref={ref}
            id={id}
            type="search"
            value={value}
            disabled={disabled}
            // `aria-invalid` é o que comunica erro a leitor de tela; borda
            // vermelha sozinha é informação exclusivamente visual.
            aria-invalid={error ? true : undefined}
            // Aponta para a mensagem certa: erro tem prioridade sobre dica.
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              "w-full",
              "bg-[var(--field-bg)] text-text",
              "border border-[var(--field-border)]",
              "rounded-[var(--field-radius)]",
              "transition-[border-color,box-shadow] duration-[130ms] ease-out",
              "hover:border-[var(--field-border-hover)]",
              "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
              "disabled:cursor-not-allowed disabled:bg-[var(--field-bg-disabled)] disabled:opacity-60",
              // O X nativo do type="search" no WebKit não é estilizável e
              // duplicaria o nosso botão de limpar.
              "[&::-webkit-search-cancel-button]:appearance-none",
              size === "sm" &&
                "h-[var(--control-height-sm)] pl-8 pr-8 text-[length:var(--fs-sm)]",
              size === "md" &&
                "h-[var(--control-height-md)] pl-9 pr-9 text-[length:var(--fs-sm)]",
              size === "lg" &&
                "h-[var(--control-height-lg)] pl-10 pr-10 text-[length:var(--fs-base)]",
              error && "border-danger-solid",
            )}
            {...props}
          />

          {showClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label={`Limpar ${label.toLowerCase()}`}
              className={cn(
                "absolute right-2 grid place-items-center",
                "size-5 rounded-[var(--r-xs)]",
                "text-text-subtle hover:text-text hover:bg-surface-hover",
                "transition-colors duration-[130ms] ease-out",
                "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
              )}
            >
              <CloseIcon className="size-3" />
            </button>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-xs text-text-subtle">
            {hint}
          </p>
        )}
        {error && (
          // `role="alert"` faz o leitor de tela anunciar a mensagem assim que
          // ela aparece, sem esperar o foco voltar ao campo.
          <p id={errorId} role="alert" className="text-xs text-danger-text">
            {error}
          </p>
        )}
      </div>
    );
  },
);

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m10.5 10.5 3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path
        d="M2.5 2.5l7 7m0-7l-7 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
