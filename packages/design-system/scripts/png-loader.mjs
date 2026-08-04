/**
 * Carregador de PNG para o Node.
 *
 * O gerador de previews roda fora do Vite, e o Node não sabe importar imagem —
 * `import fire from "./fireType.png"` é erro de módulo desconhecido. Este
 * gancho resolve o import devolvendo o arquivo como data URI.
 *
 * O efeito colateral é o que a galeria precisava: cada preview vira um HTML
 * **realmente** autocontido, com CSS e símbolos embutidos. O Claude Design
 * bloqueia requisição para host externo, então imagem por caminho relativo
 * chegaria quebrada.
 *
 * Registrado antes do tsx para que o gancho dele não tente compilar o PNG
 * como TypeScript:
 *
 *   node --import ./scripts/png-loader.mjs --import tsx scripts/build-previews.tsx
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export async function load(url, context, next) {
  if (url.endsWith(".png")) {
    const bytes = await readFile(fileURLToPath(url));
    return {
      format: "module",
      shortCircuit: true,
      source: `export default "data:image/png;base64,${bytes.toString("base64")}";`,
    };
  }
  return next(url, context);
}

export async function resolve(specifier, context, next) {
  if (specifier.endsWith(".png")) {
    return {
      url: new URL(specifier, context.parentURL).href,
      format: "module",
      shortCircuit: true,
    };
  }
  return next(specifier, context);
}
