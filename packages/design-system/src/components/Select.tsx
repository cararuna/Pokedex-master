import * as RadixSelect from "@radix-ui/react-select";
import { forwardRef, useId } from "react";
import { cn } from "../lib/cn";

/**
 * Select — escolha única a partir de uma lista.
 *
 * Substitui o `<select>` cru do filtro de tipos, que não tinha rótulo e não
 * podia ser estilizado por dentro (o desenho da lista aberta pertence ao SO).
 *
 * Sobre trocar o nativo por Radix: aqui a escolha é menos óbvia que no Dialog,
 * porque `<select>` já é acessível e no celular abre o seletor do sistema, que
 * é excelente. Vale a troca por dois motivos concretos deste projeto: a lista
 * precisa mostrar o TypeChip colorido junto de cada opção — impossível no
 * nativo, que só aceita texto — e o gatilho precisa ter exatamente a mesma
 * altura e o mesmo anel de foco do Button e do SearchField ao lado.
 *
 * O Radix mantém a navegação por setas, busca por digitação e Escape.
 */

export interface SelectOption {
  value: string;
  label: string;
  /** Elemento à esquerda do rótulo — ícone, chip de tipo. */
  adornment?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  hideLabel?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  hint?: string;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    label,
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder = "Selecione",
    hideLabel = false,
    size = "md",
    disabled,
    hint,
    className,
  },
  ref,
) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className={cn("text-sm font-medium text-text", hideLabel && "sr-only")}
      >
        {label}
      </label>

      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          ref={ref}
          id={id}
          aria-describedby={hint ? hintId : undefined}
          className={cn(
            "inline-flex w-full items-center justify-between gap-2",
            "bg-[var(--field-bg)] text-text",
            "border border-[var(--field-border)]",
            "rounded-[var(--field-radius)]",
            "transition-[border-color,box-shadow] duration-[130ms] ease-out",
            "hover:border-[var(--field-border-hover)]",
            "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
            "disabled:cursor-not-allowed disabled:bg-[var(--field-bg-disabled)] disabled:opacity-60",
            "data-[placeholder]:text-[var(--field-placeholder)]",
            size === "sm" && "h-[var(--control-height-sm)] px-[var(--control-padding-x-sm)] text-[length:var(--fs-sm)]",
            size === "md" && "h-[var(--control-height-md)] px-[var(--control-padding-x-md)] text-[length:var(--fs-sm)]",
            size === "lg" && "h-[var(--control-height-lg)] px-[var(--control-padding-x-lg)] text-[length:var(--fs-base)]",
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronIcon className="size-3.5 text-text-subtle" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className={cn(
              "z-[var(--z-popover)] overflow-hidden",
              "min-w-[var(--radix-select-trigger-width)]",
              "max-h-[min(20rem,var(--radix-select-content-available-height))]",
              "bg-[var(--overlay-bg)]",
              "border border-border",
              "rounded-[var(--r-md)]",
              "shadow-[var(--sh-lg)]",
              "data-[state=open]:animate-[fade-in_var(--dur-fast)_var(--ez-out)]",
            )}
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center gap-2",
                    "rounded-[var(--r-sm)] py-1.5 pl-2 pr-8",
                    "text-sm text-text",
                    "outline-none",
                    // `highlighted` cobre teclado e mouse ao mesmo tempo —
                    // usar :hover deixaria a navegação por seta sem destaque.
                    "data-[highlighted]:bg-surface-hover",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
                  )}
                >
                  {option.adornment}
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="absolute right-2">
                    <CheckIcon className="size-3.5 text-accent-text" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {hint && (
        <p id={hintId} className="text-xs text-text-subtle">
          {hint}
        </p>
      )}
    </div>
  );
});

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path d="M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={className}>
      <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
