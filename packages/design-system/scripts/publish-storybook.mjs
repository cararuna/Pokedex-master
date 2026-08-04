/**
 * Publica o Storybook estático como projeto próprio na Vercel.
 *
 * Uso:  pnpm --filter @pokedex/design-system publish:storybook
 *
 * ── Por que a pasta intermediária ────────────────────────────────────────
 *
 * A Vercel CLI procura o vínculo (`.vercel/project.json`) subindo a árvore de
 * diretórios. Rodar o deploy de dentro do repositório encontraria o vínculo do
 * *aplicativo* e publicaria o Storybook por cima do site — em produção, sem
 * pedir confirmação.
 *
 * Copiar a saída para `.storybook-deploy/`, que tem vínculo próprio, torna o
 * engano impossível: o diretório não tem como alcançar o `.vercel` da raiz
 * porque o vínculo dele é encontrado primeiro.
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const PACOTE = join(AQUI, "..");
const ORIGEM = join(PACOTE, "storybook-static");
const DESTINO = join(PACOTE, ".storybook-deploy");

const PROJETO = "pokedex-design-system";
const ESCOPO = "cararunas-projects";

function vercel(...args) {
  // `shell: true` porque no Windows o pnpm é um .cmd, que o execFile não
  // executa diretamente.
  return execFileSync("pnpm", ["dlx", "vercel@latest", ...args], {
    cwd: DESTINO,
    stdio: "inherit",
    shell: true,
  });
}

if (!existsSync(ORIGEM)) {
  console.error(
    "\n✗ storybook-static não existe.\n" +
      "  Rode antes: pnpm --filter @pokedex/design-system build-storybook\n",
  );
  process.exit(1);
}

// O vínculo é preservado entre execuções; só o conteúdo é trocado.
const vinculo = join(DESTINO, ".vercel");
const tinhaVinculo = existsSync(vinculo);
if (tinhaVinculo) cpSync(vinculo, join(PACOTE, ".vercel-tmp"), { recursive: true });

rmSync(DESTINO, { recursive: true, force: true });
cpSync(ORIGEM, DESTINO, { recursive: true });

if (tinhaVinculo) {
  cpSync(join(PACOTE, ".vercel-tmp"), vinculo, { recursive: true });
  rmSync(join(PACOTE, ".vercel-tmp"), { recursive: true, force: true });
} else {
  vercel("link", "--yes", "--scope", ESCOPO, "--project", PROJETO);
}

vercel("deploy", "--prod", "--yes", "--scope", ESCOPO);

console.log(`\n✓ https://${PROJETO}.vercel.app\n`);
