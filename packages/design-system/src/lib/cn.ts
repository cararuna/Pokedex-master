import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Junta classes resolvendo conflitos do Tailwind.
 *
 * O `clsx` sozinho concatena: `cn("p-2", "p-4")` viraria `"p-2 p-4"` e o
 * vencedor passaria a depender da ordem no CSS gerado, não da ordem do
 * argumento. O `twMerge` entende as famílias de utilitário e mantém só o
 * último — `"p-4"`.
 *
 * É o que permite um componente aceitar `className` de fora e o consumidor
 * conseguir sobrescrever de fato o padrão, sem `!important`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
