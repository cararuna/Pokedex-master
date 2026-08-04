import * as RadixTooltip from "@radix-ui/react-tooltip";
import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Tooltip — texto curto de apoio, revelado no hover ou no foco.
 *
 * Duas regras que decidem se ele ajuda ou atrapalha:
 *
 * 1. Nunca guarda informação essencial. Tooltip não aparece em toque, e o
 *    conteúdo some no instante em que o ponteiro sai. Se a pessoa precisa
 *    daquilo para decidir, é texto na tela.
 *
 * 2. Aparece no foco, não só no hover. O Radix já cobre isso — é o motivo
 *    de não usar `title=""`, que só responde a mouse e tem atraso do SO
 *    que ninguém controla.
 *
 * O Provider fica na raiz da aplicação. Ele é quem coordena o "skip delay":
 * depois do primeiro tooltip, os vizinhos abrem na hora, em vez de cada um
 * cobrar a espera inteira de novo.
 */

export const TooltipProvider = RadixTooltip.Provider;

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Atraso até abrir. Padrão 300ms — curto o bastante sem disparar de raspão. */
  delayDuration?: number;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { content, children, side = "top", align = "center", delayDuration = 300 },
  ref,
) {
  return (
    <RadixTooltip.Root delayDuration={delayDuration}>
      {/* asChild evita um wrapper extra que quebraria layouts em flex/grid */}
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          ref={ref}
          side={side}
          align={align}
          sideOffset={6}
          // `collisionPadding` impede o tooltip de encostar na borda da janela
          collisionPadding={8}
          className={cn(
            "z-[var(--z-tooltip)] max-w-[16rem]",
            "bg-[var(--tooltip-bg)] text-[var(--tooltip-text)]",
            "rounded-[var(--tooltip-radius)]",
            "px-2 py-1",
            "text-[length:var(--tooltip-font-size)] leading-snug",
            "shadow-[var(--sh-md)]",
            "select-none",
            "data-[state=delayed-open]:animate-[fade-in_var(--dur-fast)_var(--ez-out)]",
            "data-[state=closed]:animate-[fade-out_var(--dur-instant)_var(--ez-in)]",
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-[var(--tooltip-bg)]" width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
});
