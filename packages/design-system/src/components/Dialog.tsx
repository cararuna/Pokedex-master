import * as RadixDialog from "@radix-ui/react-dialog";
import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Dialog — janela modal.
 *
 * Construído sobre Radix. A decisão de não escrever do zero é deliberada e
 * defensável: um diálogo correto precisa de foco preso dentro dele, foco
 * devolvido ao gatilho ao fechar, `aria-modal`, Escape, clique no scrim,
 * inerte no resto da página e bloqueio de scroll sem o layout saltar quando
 * a barra some. São semanas de detalhe e é onde implementações caseiras
 * falham — sempre no teclado e no leitor de tela, que é justamente quem
 * mais depende disso.
 *
 * O que é nosso: a aparência inteira, saindo dos tokens --overlay-*.
 * O Radix não traz estilo nenhum.
 */

const DialogRoot = RadixDialog.Root;
const DialogTrigger = RadixDialog.Trigger;
const DialogClose = RadixDialog.Close;
const DialogPortal = RadixDialog.Portal;

const DialogOverlay = forwardRef<
  React.ElementRef<typeof RadixDialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <RadixDialog.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-[var(--z-overlay)]",
        "bg-[var(--overlay-scrim)]",
        "backdrop-blur-[2px]",
        // Radix expõe data-state; a animação é atrelada a ele em vez de
        // depender de classe alternada por JavaScript.
        "data-[state=open]:animate-[fade-in_var(--overlay-enter-duration)_var(--ez-out)]",
        "data-[state=closed]:animate-[fade-out_var(--overlay-exit-duration)_var(--ez-in)]",
        className,
      )}
      {...props}
    />
  );
});

const DialogContent = forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
    /** Esconde o X do canto. Use só quando houver outro caminho de saída. */
    hideClose?: boolean;
  }
>(function DialogContent({ className, children, hideClose = false, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-[var(--z-dialog)]",
          "-translate-x-1/2 -translate-y-1/2",
          "w-[calc(100vw-var(--space-8))] max-w-[var(--overlay-max-width)]",
          "max-h-[calc(100dvh-var(--space-16))] overflow-y-auto",
          "bg-[var(--overlay-bg)]",
          "border border-border",
          "rounded-[var(--overlay-radius)]",
          "shadow-[var(--overlay-shadow)]",
          "p-[var(--overlay-padding)]",
          "focus:outline-none",
          "data-[state=open]:animate-[dialog-in_var(--overlay-enter-duration)_var(--ez-out)]",
          "data-[state=closed]:animate-[dialog-out_var(--overlay-exit-duration)_var(--ez-in)]",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <RadixDialog.Close
            className={cn(
              "absolute right-4 top-4 grid size-7 place-items-center",
              "rounded-[var(--r-sm)] text-text-subtle",
              "transition-colors duration-[130ms] ease-out",
              "hover:bg-surface-hover hover:text-text",
              "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
            )}
          >
            {/* O rótulo textual é obrigatório: um X sozinho não é anunciado. */}
            <span className="sr-only">Close</span>
            <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className="size-3.5">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </RadixDialog.Close>
        )}
      </RadixDialog.Content>
    </DialogPortal>
  );
});

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 flex flex-col gap-1.5 pr-8", className)} {...props} />
);

const DialogTitle = forwardRef<
  React.ElementRef<typeof RadixDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <RadixDialog.Title
      ref={ref}
      className={cn("font-display text-2xl font-semibold tracking-tight text-text", className)}
      {...props}
    />
  );
});

const DialogDescription = forwardRef<
  React.ElementRef<typeof RadixDialog.Description>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <RadixDialog.Description
      ref={ref}
      className={cn("text-sm leading-normal text-text-muted", className)}
      {...props}
    />
  );
});

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Title: DialogTitle,
  Description: DialogDescription,
  Footer: DialogFooter,
  Close: DialogClose,
});
