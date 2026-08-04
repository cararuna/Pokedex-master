import { forwardRef } from "react";
import { cn } from "../lib/cn";
import { Button } from "./Button";

/* ============================================================================
   EmptyState · StatBar · Pagination
   Componentes de feedback e apresentação de dado.
   ============================================================================ */

/**
 * EmptyState — o que ocupa o lugar do conteúdo quando não há conteúdo.
 *
 * Vazio sem tratamento é a falha mais comum de uma lista com filtro: a pessoa
 * digita algo sem resultado, a grade fica em branco e não fica claro se a
 * busca falhou, se está carregando ou se o filtro é o culpado.
 *
 * Um bom estado vazio responde três coisas: o que aconteceu, por quê, e qual
 * é o próximo passo. Daí a `action` não ser opcional por acaso — quando não
 * há ação possível, o texto precisa pelo menos explicar a causa.
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState({ title, description, icon, action, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3",
          "px-6 py-16 text-center",
          "rounded-[var(--r-lg)] border border-dashed border-border",
          className,
        )}
        {...props}
      >
        {icon && <div className="text-text-subtle [&_svg]:size-8">{icon}</div>}
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-lg font-semibold text-text">{title}</p>
          {description && (
            <p className="max-w-[38ch] text-sm leading-normal text-text-muted">
              {description}
            </p>
          )}
        </div>
        {action && (
          <Button variant="soft" size="sm" onClick={action.onClick} className="mt-1">
            {action.label}
          </Button>
        )}
      </div>
    );
  },
);

/**
 * StatBar — atributo numérico como barra proporcional.
 *
 * Componente de domínio: HP, Ataque, Defesa e companhia. A barra é decorativa
 * (`aria-hidden`) e o valor real fica no texto ao lado — quem usa leitor de
 * tela recebe "Ataque 84", não uma descrição de comprimento de barra.
 *
 * `max` tem padrão 255 porque é o teto de um atributo base na série. Deixar
 * o máximo implícito faria barras de telas diferentes não serem comparáveis.
 */
export interface StatBarProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number;
  max?: number;
  /** Cor da barra. Padrão usa o acento; passe um tipo para colorir por elemento. */
  color?: string;
}

export const StatBar = forwardRef<HTMLDivElement, StatBarProps>(function StatBar(
  { label, value, max = 255, color, className, ...props },
  ref,
) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      ref={ref}
      className={cn("grid grid-cols-[7rem_2.5rem_1fr] items-center gap-3", className)}
      {...props}
    >
      <span className="text-xs uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-right font-mono text-sm tabular-nums text-text">{value}</span>
      <div
        aria-hidden="true"
        className="h-1.5 overflow-hidden rounded-[var(--r-pill)] bg-surface-sunken"
      >
        <div
          className="h-full rounded-[var(--r-pill)] transition-[width] duration-[280ms] ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color ?? "var(--accent-solid)",
          }}
        />
      </div>
    </div>
  );
});

/**
 * Pagination — navegação entre páginas de resultado.
 *
 * É um `<nav>` com `aria-label`, e a página atual carrega `aria-current="page"`.
 * Sem isso, quem navega por leitor de tela ouve uma fileira de números sem
 * saber em qual está.
 *
 * A janela de páginas é fixa em 5 com reticências: mostrar todas as páginas
 * de um catálogo de 300 itens estoura o layout e não ajuda ninguém.
 */
export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  function Pagination({ page, totalPages, onPageChange, className, ...props }, ref) {
    if (totalPages <= 1) return null;

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn("flex items-center justify-center gap-1", className)}
        {...props}
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Anterior
        </Button>

        {buildPageWindow(page, totalPages).map((item, i) =>
          item === "…" ? (
            <span
              key={`gap-${i}`}
              aria-hidden="true"
              className="px-1.5 text-sm text-text-subtle"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "soft" : "ghost"}
              size="sm"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              aria-label={`Página ${item}`}
              className="min-w-9 tabular-nums"
            >
              {item}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Próxima
        </Button>
      </nav>
    );
  },
);

/** Janela deslizante de páginas, com primeira e última sempre visíveis. */
function buildPageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);

  if (start > 2) items.push("…");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("…");

  items.push(total);
  return items;
}
