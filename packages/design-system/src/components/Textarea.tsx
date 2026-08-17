import { forwardRef, useId } from "react";
import { cn } from "../lib/cn";

/**
 * Textarea — texto de várias linhas, com rótulo, dica, erro e contador.
 *
 * Mesmas decisões do `SearchField`, pelos mesmos motivos: `<label>` de verdade
 * associado por `id` (placeholder não é rótulo), `aria-invalid` para comunicar
 * erro a quem não vê a borda vermelha, e `aria-describedby` apontando para a
 * mensagem certa — erro tem prioridade sobre dica.
 *
 * O que é próprio daqui:
 *
 * **O contador é `aria-live="polite"`, não mudo.** Um contador que só existe
 * visualmente deixa quem usa leitor de tela descobrir o limite ao ser barrado
 * no envio. `polite` anuncia sem interromper a digitação.
 *
 * **`maxLength` não é a única defesa.** Ele impede digitar além do limite, mas
 * não impede colar em alguns navegadores, e não vale nada contra requisição
 * feita fora da tela. O limite real é o do Zod na API; este aqui é cortesia.
 */

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label: string;
  /** Esconde o rótulo visualmente, mantendo-o para tecnologia assistiva. */
  hideLabel?: boolean;
  hint?: string;
  /** Mensagem de erro. Presente, marca o campo como inválido. */
  error?: string;
  /** Mostra "n / max" abaixo do campo. Exige `maxLength`. */
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      hideLabel = false,
      hint,
      error,
      showCount = false,
      className,
      id: idProp,
      value,
      maxLength,
      rows = 3,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    const contar = showCount && typeof maxLength === "number";
    const usados = typeof value === "string" ? value.length : 0;

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label
          htmlFor={id}
          className={cn("text-sm font-medium text-text", hideLabel && "sr-only")}
        >
          {label}
        </label>

        <textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            "w-full px-3 py-2",
            "bg-[var(--field-bg)] text-text",
            "border border-[var(--field-border)]",
            "rounded-[var(--field-radius)]",
            "text-[length:var(--fs-sm)] leading-relaxed",
            "transition-[border-color,box-shadow] duration-[130ms] ease-out",
            "hover:border-[var(--field-border-hover)]",
            "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
            "disabled:cursor-not-allowed disabled:bg-[var(--field-bg-disabled)] disabled:opacity-60",
            // Só vertical: redimensionar na horizontal quebra a coluna que o
            // layout definiu, e o conteúdo aqui cresce para baixo.
            "resize-y",
            error && "border-danger-solid",
          )}
          {...props}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {hint && !error && (
              <p id={hintId} className="text-xs text-text-subtle">
                {hint}
              </p>
            )}
            {error && (
              <p id={errorId} role="alert" className="text-xs text-danger-text">
                {error}
              </p>
            )}
          </div>

          {contar && (
            <p
              aria-live="polite"
              className={cn(
                "shrink-0 text-xs tabular-nums",
                usados >= maxLength ? "text-danger-text" : "text-text-subtle",
              )}
            >
              {usados} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);
