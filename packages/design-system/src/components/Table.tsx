import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Table — dados tabulares.
 *
 * Usa `<table>` de verdade, não `<div>` com grid. A tabela semântica dá ao
 * leitor de tela a leitura por coordenada ("coluna Poder, linha Lança-chamas")
 * e permite navegar célula a célula. Com divs, a pessoa ouve uma sequência
 * de números sem saber a que coluna cada um pertence.
 *
 * Só use para dado realmente tabular — mesmos atributos comparados entre
 * itens. Lista de cartões não é tabela.
 *
 * O contêiner rola na horizontal com `tabindex={0}`: região que rola precisa
 * ser alcançável por teclado, senão quem não usa mouse não vê as colunas da
 * direita.
 */

const TableRoot = forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement> & { containerClassName?: string }
>(function Table({ className, containerClassName, ...props }, ref) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Horizontally scrollable table"
      className={cn(
        "w-full overflow-x-auto",
        "rounded-[var(--r-md)] border border-border",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
        containerClassName,
      )}
    >
      <table
        ref={ref}
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
});

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableHeader({ className, ...props }, ref) {
  return (
    <thead
      ref={ref}
      className={cn("bg-surface-sunken", className)}
      {...props}
    />
  );
});

const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(function TableBody({ className, ...props }, ref) {
  return (
    <tbody
      ref={ref}
      // Divisória entre linhas em vez de zebra: com papel marfim, o listrado
      // suja o fundo; a linha fina separa sem introduzir uma segunda cor.
      className={cn("[&_tr:not(:last-child)]:border-b [&_tr]:border-border-subtle", className)}
      {...props}
    />
  );
});

const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }
>(function TableRow({ className, interactive = false, ...props }, ref) {
  return (
    <tr
      ref={ref}
      className={cn(
        "transition-colors duration-[130ms] ease-out",
        interactive && "cursor-pointer hover:bg-surface-hover",
        className,
      )}
      {...props}
    />
  );
});

const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(function TableHead({ className, ...props }, ref) {
  return (
    <th
      ref={ref}
      // `scope` é o que amarra a célula à sua coluna para tecnologia assistiva.
      scope="col"
      className={cn(
        "px-3 py-2.5 text-left align-middle",
        "text-2xs font-semibold uppercase tracking-wider text-text-subtle",
        "whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
});

const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(function TableCell({ className, ...props }, ref) {
  return (
    <td
      ref={ref}
      className={cn("px-3 py-2.5 align-middle text-text", className)}
      {...props}
    />
  );
});

const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(function TableCaption({ className, ...props }, ref) {
  return (
    <caption
      ref={ref}
      className={cn("px-3 py-2 text-left text-xs text-text-subtle", className)}
      {...props}
    />
  );
});

export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Caption: TableCaption,
});
