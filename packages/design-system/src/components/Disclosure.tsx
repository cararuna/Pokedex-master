import { forwardRef } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { cn } from "../lib/cn";

/**
 * Disclosure — um resumo que abre para o detalhe.
 *
 * Existe porque uma lista de registros ricos fica ilegível quando cada item
 * mostra tudo. O histórico de mudanças foi o caso: cada entrada trazia título,
 * autor, tabela de diff, raciocínio do modelo e erro — cinco blocos por linha,
 * vinte linhas na tela, e nada se distinguia de nada.
 *
 * A regra que a API impõe: **o resumo é sempre visível, o resto é sob
 * demanda.** Quem varre a lista lê uma linha por item; quem parou num item
 * abre. É a hierarquia que a lista não tinha.
 *
 * **Por que Radix Collapsible e não `<details>`.** O nativo resolve quase
 * tudo e seria a escolha certa se a aparência não importasse — mas ele não
 * anima altura (`content-visibility` não interpola), o marcador é difícil de
 * estilizar de forma consistente entre navegadores, e não dá controle sobre
 * `aria-expanded` no elemento que a gente quer. O Radix entrega o estado, o
 * `aria-controls`/`aria-expanded` corretos e as variáveis de altura para a
 * transição, e a aparência continua nossa.
 */

export interface DisclosureProps {
  /** Sempre visível. É a linha que a pessoa lê ao varrer a lista. */
  summary: React.ReactNode;
  /** À direita do resumo, fora do gatilho — para status, valores, ações. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export const Disclosure = forwardRef<HTMLDivElement, DisclosureProps>(
  function Disclosure(
    { summary, aside, children, defaultOpen = false, open, onOpenChange, className },
    ref,
  ) {
    return (
      <CollapsiblePrimitive.Root
        ref={ref}
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={onOpenChange}
        className={cn(
          "rounded-[var(--r-md)] border border-border bg-surface",
          "transition-colors duration-[130ms] ease-out",
          className,
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/*
            O gatilho envolve só o resumo, e `aside` fica fora dele.
            Botão dentro de botão é HTML inválido, e um status clicável que não
            faz nada confunde — a ação de expandir pertence ao texto.
          */}
          <CollapsiblePrimitive.Trigger
            className={cn(
              "group flex min-w-0 flex-1 items-center gap-2.5 text-left",
              "rounded-[var(--r-sm)]",
              "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
            )}
          >
            <Chevron
              className={cn(
                "size-3.5 shrink-0 text-text-subtle",
                "transition-transform duration-[160ms] ease-out",
                "group-data-[state=open]:rotate-90",
              )}
            />
            <div className="min-w-0 flex-1">{summary}</div>
          </CollapsiblePrimitive.Trigger>

          {aside && <div className="shrink-0">{aside}</div>}
        </div>

        {/*
          A animação usa `--radix-collapsible-content-height`, que o Radix mede
          e publica. É o que `height: auto` nunca conseguiu animar.
        */}
        <CollapsiblePrimitive.Content
          className={cn(
            "overflow-hidden",
            "data-[state=open]:animate-[disclosure-open_160ms_ease-out]",
            "data-[state=closed]:animate-[disclosure-close_140ms_ease-out]",
          )}
        >
          <div className="border-t border-border px-4 py-3">{children}</div>
        </CollapsiblePrimitive.Content>
      </CollapsiblePrimitive.Root>
    );
  },
);

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className={className}>
      <path
        d="M4.5 2.5 8 6l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
