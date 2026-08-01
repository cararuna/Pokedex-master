#!/usr/bin/env node
/**
 * ETL — PokeAPI → dataset do jogo de tabuleiro.
 *
 * Roda **uma vez**, offline, e grava um JSON no repositório. A aplicação
 * deixa de falar com a PokeAPI: ela lê o arquivo gerado aqui.
 *
 * Este script é a ponte para a Fase 2. O JSON que ele emite é exatamente o
 * seed das tabelas do Supabase — a mesma transformação, o mesmo formato. Quando
 * as credenciais chegarem, muda só o destino da escrita.
 *
 * ── A regra do jogo ──────────────────────────────────────────────────────
 *
 * Recuperada de MovimentosCompletos.tsx (commit 15b6492). Não é arredondamento
 * genérico: é a conversão que faz o dano da série caber num dado do tabuleiro.
 *
 *   1. só golpes aprendidos por NÍVEL, com poder > 0
 *   2. poder → ceil(poder / 10)
 *   3. teto 10
 *   4. qualquer valor ≤ 7 vira 8
 *      → a escala final do jogo é 8, 9 ou 10
 *   5. UM golpe por tipo: fica o de maior valor
 *
 * O passo 5 é o que dá sentido ao filtro da tela: cada Pokémon tem no máximo
 * um ataque por tipo, e o jogador procura "quem aprende ataque de fogo".
 *
 * ── Custo ────────────────────────────────────────────────────────────────
 *
 * A versão anterior fazia isto no navegador, a cada abertura da página, sem
 * cache: ~15.000 requisições. Aqui o cache de golpes é global — cada golpe da
 * série é buscado uma única vez, e não uma vez por Pokémon que o aprende.
 * Dá ~390 + ~800 requisições, uma vez na vida.
 *
 * Uso:  node scripts/build-dataset.mjs [quantidade]
 */

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://pokeapi.co/api/v2";

/** Padrão: as 3 primeiras gerações, o escopo do jogo. */
const LIMITE = Number(process.argv[2] ?? 386);

const overrides = JSON.parse(
  readFileSync(join(ROOT, "src/game/moveOverrides.json"), "utf8"),
);

/* ── Regra do jogo ──────────────────────────────────────────────────────── */

/** Converte o poder da série para a escala do tabuleiro: 8, 9 ou 10. */
export function toGamePower(power) {
  let value = Math.ceil(power / 10);
  if (value > 10) value = 10;
  if (value <= 7) value = 8;
  return value;
}

/* ── Rede, com cache e paciência ────────────────────────────────────────── */

const moveCache = new Map();
let requisicoes = 0;

async function getJson(url, tentativa = 0) {
  requisicoes++;
  try {
    const r = await fetch(url);
    if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
    if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
    return await r.json();
  } catch (err) {
    // A PokeAPI é gratuita e limita taxa. Recuo exponencial em vez de
    // desistir — o script roda uma vez, pode se dar ao luxo de esperar.
    if (tentativa < 4) {
      await new Promise((r) => setTimeout(r, 400 * 2 ** tentativa));
      return getJson(url, tentativa + 1);
    }
    throw err;
  }
}

/** Golpe buscado uma vez por golpe, não uma vez por Pokémon que o aprende. */
async function getMove(url) {
  if (moveCache.has(url)) return moveCache.get(url);
  const promessa = getJson(url);
  moveCache.set(url, promessa);
  return promessa;
}

/* ── Extração ───────────────────────────────────────────────────────────── */

async function buildPokemon(slug, dexNumber) {
  const raw = await getJson(`${BASE}/pokemon/${slug}`);

  const porTipo = {};

  const aprendidosPorNivel = raw.moves.filter((m) =>
    m.version_group_details.some(
      (d) => d.move_learn_method.name === "level-up",
    ),
  );

  const golpes = await Promise.all(
    aprendidosPorNivel.map((m) => getMove(m.move.url).catch(() => null)),
  );

  for (const move of golpes) {
    if (!move || !move.power || move.power <= 0) continue;

    const tipo = move.type.name;
    const valor = toGamePower(move.power);

    // Um por tipo: fica o mais forte.
    if (!porTipo[tipo] || porTipo[tipo].power < valor) {
      porTipo[tipo] = { attackName: move.name, moveType: tipo, power: valor };
    }
  }

  // Ajustes manuais do jogo — golpes que o mestre adicionou fora da regra.
  for (const extra of overrides[slug] ?? []) {
    if (!porTipo[extra.moveType] || porTipo[extra.moveType].power < extra.power) {
      porTipo[extra.moveType] = extra;
    }
  }

  return {
    id: raw.id,
    dexNumber,
    slug: raw.name,
    types: raw.types.map((t) => t.type.name),
    abilities: raw.abilities.map((a) => a.ability.name),
    sprites: {
      // As gerações que o seletor da tela oferece. Guardadas todas de uma vez
      // para trocar de arte sem nova requisição.
      "generation-i": raw.sprites.versions?.["generation-i"]?.["red-blue"]?.front_default ?? null,
      "generation-ii": raw.sprites.versions?.["generation-ii"]?.gold?.front_default ?? null,
      "generation-iii": raw.sprites.versions?.["generation-iii"]?.["firered-leafgreen"]?.front_default ?? null,
      "generation-iv": raw.sprites.versions?.["generation-iv"]?.["diamond-pearl"]?.front_default ?? null,
      "generation-v": raw.sprites.versions?.["generation-v"]?.["black-white"]?.front_default ?? null,
      icons: raw.sprites.versions?.["generation-vii"]?.icons?.front_default ?? null,
      "3d": raw.sprites.versions?.["generation-vii"]?.["ultra-sun-ultra-moon"]?.front_default ?? null,
      artwork: raw.sprites.other?.["official-artwork"]?.front_default ?? null,
      default: raw.sprites.front_default ?? null,
    },
    moves: Object.values(porTipo).sort((a, b) => b.power - a.power),
  };
}

/* ── Execução ───────────────────────────────────────────────────────────── */

async function main() {
  console.log(`Montando dataset de ${LIMITE} Pokémon…\n`);
  const inicio = Date.now();

  const index = await getJson(`${BASE}/pokemon?limit=${LIMITE}&offset=0`);

  const resultado = [];
  const LOTE = 12; // gentil com a API gratuita

  for (let i = 0; i < index.results.length; i += LOTE) {
    const lote = index.results.slice(i, i + LOTE);
    const feitos = await Promise.all(
      lote.map((p, j) =>
        buildPokemon(p.name, i + j + 1).catch((e) => {
          console.warn(`  ! ${p.name}: ${e.message}`);
          return null;
        }),
      ),
    );
    resultado.push(...feitos.filter(Boolean));
    process.stdout.write(
      `\r  ${resultado.length}/${LIMITE}  ·  ${requisicoes} requisições  ·  ${moveCache.size} golpes únicos`,
    );
  }

  const destino = join(ROOT, "src/game/dataset.json");
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, JSON.stringify(resultado));

  const semGolpes = resultado.filter((p) => p.moves.length === 0).length;
  const totalGolpes = resultado.reduce((a, p) => a + p.moves.length, 0);

  console.log(`\n\n✓ ${resultado.length} Pokémon gravados em src/game/dataset.json`);
  console.log(`  ${totalGolpes} golpes convertidos para a escala do jogo`);
  console.log(`  ${semGolpes} sem nenhum golpe de ataque`);
  console.log(`  ${requisicoes} requisições · ${((Date.now() - inicio) / 1000).toFixed(0)}s`);
  console.log(`\n  Este JSON é o seed das tabelas do Supabase na Fase 2.`);
}

main().catch((e) => {
  console.error("\nFalhou:", e);
  process.exit(1);
});
