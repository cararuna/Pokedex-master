#!/usr/bin/env node
/**
 * Linter de camadas do design system.
 *
 * A regra "componente nunca referencia token primitivo" só vale alguma coisa
 * se algo a verificar. Convenção escrita em README sobrevive umas três semanas;
 * o que sobrevive é o que quebra o build.
 *
 * O que é proibido, e por quê:
 *
 *   1. Componente usando cor primitiva  (var(--ink-700), bg-forest-600)
 *      → congela o componente num tema. O modo escuro reaponta a camada
 *        semântica; quem pula direto para o primitivo não acompanha.
 *
 *   2. Cor literal em componente  (#fff, rgb(...), hsl(...))
 *      → o valor fica fora do sistema e some do inventário de tokens.
 *
 *   3. Utilitário de cor do Tailwind  (bg-red-500, text-slate-700)
 *      → a paleta padrão está zerada com `--color-*: initial`, então isso
 *        nem renderiza. Falhar aqui dá uma mensagem clara em vez de um
 *        elemento invisível.
 *
 * Uso:  node scripts/lint-tokens.mjs
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/* Diretórios auditados: onde vivem os componentes.
   `styles/` fica de fora — é lá que os primitivos são declarados. */
const AUDITED = ["src/components", "src/primitives", "src/lib"];

/* Famílias de cor da camada 1. Não incluem espaço/raio/tipografia:
   escalas numéricas podem ser consumidas direto, só cor é que carrega tema. */
const PRIMITIVE_COLORS = [
  "ink",
  "paper",
  "forest",
  "brass",
  "moss",
  "amber",
  "rust",
  "slate",
];

/* Paleta padrão do Tailwind — zerada no @theme, então é sempre erro. */
const TAILWIND_PALETTE = [
  "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber",
  "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue",
  "indigo", "violet", "purple", "fuchsia", "pink", "rose",
];

const RULES = [
  {
    id: "cor-primitiva-em-var",
    // var(--ink-700) — mas não var(--space-4) nem var(--r-md)
    re: new RegExp(`var\\(\\s*--(${PRIMITIVE_COLORS.join("|")})-\\d{2,3}\\b`, "g"),
    msg: (m) =>
      `usa a cor primitiva ${m.trim()} — troque pelo token semântico equivalente (--text, --surface, --accent-solid…)`,
  },
  {
    id: "cor-primitiva-em-classe",
    // bg-forest-600, text-ink-900, border-brass-300
    re: new RegExp(
      `\\b(bg|text|border|ring|fill|stroke|from|to|via|decoration|outline|shadow)-(${PRIMITIVE_COLORS.join("|")})-\\d{2,3}\\b`,
      "g",
    ),
    msg: (m) =>
      `usa o utilitário primitivo "${m}" — use a variante semântica (bg-surface-raised, text-muted, border-strong…)`,
  },
  {
    id: "paleta-do-tailwind",
    re: new RegExp(
      `\\b(bg|text|border|ring|fill|stroke)-(${TAILWIND_PALETTE.join("|")})-\\d{2,3}\\b`,
      "g",
    ),
    msg: (m) =>
      `usa "${m}", da paleta padrão do Tailwind — ela está zerada por --color-*: initial e não renderiza nada`,
  },
  {
    id: "cor-literal",
    // #abc, #aabbcc, rgb(...), hsl(...) — fora de comentário
    re: /(#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\))/g,
    msg: (m) => `tem a cor literal ${m} — toda cor precisa vir de um token`,
    // `currentColor` e `transparent` são palavras-chave, não literais: passam.
  },
];

/** Remove comentários para não acusar exemplo escrito em documentação. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // diretório ainda não criado
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(full) && !/\.stories\./.test(full)) out.push(full);
  }
  return out;
}

const violations = [];

for (const dir of AUDITED) {
  for (const file of walk(join(ROOT, dir))) {
    const raw = readFileSync(file, "utf8");
    const code = stripComments(raw);

    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let match;
      while ((match = rule.re.exec(code)) !== null) {
        const line = code.slice(0, match.index).split("\n").length;
        violations.push({
          file: relative(ROOT, file).split(sep).join("/"),
          line,
          rule: rule.id,
          message: rule.msg(match[0]),
        });
      }
    }
  }
}

if (violations.length === 0) {
  console.log("✓ camadas do design system íntegras — nenhum componente acessa primitivo");
  process.exit(0);
}

console.error(
  `\n✗ ${violations.length} violação(ões) da hierarquia de tokens\n`,
);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}`);
  console.error(`    [${v.rule}] ${v.message}\n`);
}
console.error(
  "  Regra: componente → semântica → primitivo. Pular um degrau quebra a troca de tema.\n",
);
process.exit(1);
