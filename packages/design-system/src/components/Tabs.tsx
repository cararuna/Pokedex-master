import * as RadixTabs from "@radix-ui/react-tabs";
import { forwardRef } from "react";
import { cn } from "../lib/cn";

/**
 * Tabs — alterna entre seções irmãs de conteúdo.
 *
 * O indicador é uma borda inferior de 2px, não um botão em cápsula. Numa
 * interface de catálogo, aba em cápsula compete visualmente com o Button e
 * a pessoa hesita sobre o que é ação e o que é navegação. A linha resolve
 * hierarquia sem inventar um terceiro tipo de superfície.
 *
 * Substitui o card com flip 3D da versão antiga: virar o cartão escondia o
 * conteúdo da frente, não tinha estado navegável e não existia para leitor
 * de tela — quem não via a animação não sabia que havia um verso.
 */

const TabsRoot = RadixTabs.Root;

const TabsList = forwardRef<
  React.ElementRef<typeof RadixTabs.List>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <RadixTabs.List
      ref={ref}
      className={cn(
        "relative flex items-center gap-1",
        "border-b border-border",
        // Rolagem horizontal no mobile em vez de quebrar linha: aba em duas
        // fileiras perde a leitura de "uma régua de seções".
        "overflow-x-auto",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
});

const TabsTrigger = forwardRef<
  React.ElementRef<typeof RadixTabs.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <RadixTabs.Trigger
      ref={ref}
      className={cn(
        "relative shrink-0 whitespace-nowrap",
        "px-3 py-2",
        "text-sm font-medium text-text-muted",
        "transition-colors duration-[130ms] ease-out",
        "hover:text-text",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
        "disabled:pointer-events-none disabled:opacity-45",
        "data-[state=active]:text-text",
        // A linha sai de -1px para cobrir exatamente a borda da lista, sem
        // deixar meio pixel visível por baixo.
        "after:absolute after:inset-x-0 after:-bottom-px after:h-0.5",
        "after:bg-transparent after:transition-colors after:duration-[130ms]",
        "data-[state=active]:after:bg-accent-solid",
        className,
      )}
      {...props}
    />
  );
});

const TabsContent = forwardRef<
  React.ElementRef<typeof RadixTabs.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <RadixTabs.Content
      ref={ref}
      className={cn(
        "pt-5",
        "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
        className,
      )}
      {...props}
    />
  );
});

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
