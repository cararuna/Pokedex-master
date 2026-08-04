import * as RadixDialog from "@radix-ui/react-dialog";
import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Drawer — painel lateral.
 *
 * Mesma base do Dialog (Radix), mesma acessibilidade: foco preso dentro, foco
 * devolvido ao gatilho, Escape, inerte no resto da página. O que muda é a
 * posição e o eixo da animação.
 *
 * Quando usar em vez do Dialog: quando o conteúdo é uma tarefa paralela e
 * contínua — uma conversa, um filtro complexo, um histórico. O diálogo
 * centralizado interrompe; o painel lateral acompanha, e a página continua
 * visível ao lado, o que importa quando a pessoa está comparando o que o
 * agente respondeu com o que está na tela.
 */

const DrawerRoot = RadixDialog.Root;
const DrawerTrigger = RadixDialog.Trigger;
const DrawerClose = RadixDialog.Close;

const DrawerContent = forwardRef<
  React.ElementRef<typeof RadixDialog.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
    side?: "right" | "left";
  }
>(function DrawerContent({ className, children, side = "right", ...props }, ref) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className={cn(
          "fixed inset-0 z-[var(--z-overlay)] bg-[var(--overlay-scrim)]",
          "data-[state=open]:animate-[fade-in_var(--overlay-enter-duration)_var(--ez-out)]",
          "data-[state=closed]:animate-[fade-out_var(--overlay-exit-duration)_var(--ez-in)]",
        )}
      />
      <RadixDialog.Content
        ref={ref}
        className={cn(
          "fixed inset-y-0 z-[var(--z-dialog)] flex w-full flex-col",
          "max-w-[28rem]",
          "bg-[var(--overlay-bg)] shadow-[var(--overlay-shadow)]",
          "focus:outline-none",
          side === "right" && "right-0 border-l border-border",
          side === "left" && "left-0 border-r border-border",
          side === "right" &&
            "data-[state=open]:animate-[drawer-in-right_var(--overlay-enter-duration)_var(--ez-out)] data-[state=closed]:animate-[drawer-out-right_var(--overlay-exit-duration)_var(--ez-in)]",
          side === "left" &&
            "data-[state=open]:animate-[drawer-in-left_var(--overlay-enter-duration)_var(--ez-out)] data-[state=closed]:animate-[drawer-out-left_var(--overlay-exit-duration)_var(--ez-in)]",
          className,
        )}
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
});

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 items-center justify-between gap-3",
      "border-b border-border px-5 py-3.5",
      className,
    )}
    {...props}
  />
);

const DrawerTitle = forwardRef<
  React.ElementRef<typeof RadixDialog.Title>,
  React.ComponentPropsWithoutRef<typeof RadixDialog.Title>
>(function DrawerTitle({ className, ...props }, ref) {
  return (
    <RadixDialog.Title
      ref={ref}
      className={cn("font-display text-base font-semibold tracking-tight text-text", className)}
      {...props}
    />
  );
});

const DrawerDescription = RadixDialog.Description;

/** `min-h-0` para o overflow funcionar dentro do flex column do Content. */
const DrawerBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("min-h-0 flex-1 overflow-y-auto", className)} {...props} />
);

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("shrink-0 border-t border-border p-3", className)} {...props} />
);

export const Drawer = Object.assign(DrawerRoot, {
  Trigger: DrawerTrigger,
  Content: DrawerContent,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Body: DrawerBody,
  Footer: DrawerFooter,
  Close: DrawerClose,
});
