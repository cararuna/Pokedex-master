/**
 * Seed — dataset do jogo → Supabase.
 *
 * Lê os arquivos que hoje moram no frontend e os carrega no banco:
 *
 *   game/dataset.json     386 Pokémon com golpes já convertidos
 *   game/talentTrees.ts   árvore de talentos e habilidades inatas
 *   game/rules.ts         tabela de vantagens de tipo
 *
 * Depois disto, a regra do jogo é consultável por SQL — que é o que permite o
 * agente responder "quem bate 10 de fogo" sem ler código-fonte.
 *
 * Idempotente: usa upsert em tudo. Rodar duas vezes não duplica nada.
 *
 * Uso:  pnpm --filter @pokedex/api seed
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { db } from "../src/db/client";

const AQUI = dirname(fileURLToPath(import.meta.url));
const WEB = join(AQUI, "../../web/src/game");

/**
 * O `import()` dinâmico exige URL, não caminho de sistema de arquivos. No
 * Windows um caminho absoluto começa com `D:\`, e o carregador ESM interpreta
 * o `D:` como esquema de protocolo — daí `ERR_UNSUPPORTED_ESM_URL_SCHEME`.
 * `pathToFileURL` resolve, e é inócuo no Linux e no macOS.
 */
const moduloDoJogo = (arquivo: string) =>
  pathToFileURL(join(WEB, arquivo)).href;

interface GameMove {
  attackName: string;
  moveType: string;
  power: number;
}

interface GamePokemon {
  id: number;
  dexNumber: number;
  slug: string;
  types: string[];
  sprites: Record<string, string | null>;
  moves: GameMove[];
}

/**
 * O talentTrees.ts é um módulo TypeScript, não JSON. Em vez de mantê-lo
 * duplicado aqui, o `tsx` importa direto — assim existe uma fonte só, e o
 * seed nunca fica defasado em relação ao que a tela mostra.
 */
async function carregarTalentos() {
  const mod = await import(moduloDoJogo("talentTrees.ts"));
  return {
    typeTalentTrees: mod.typeTalentTrees as Record<
      string,
      { type: string; talents: { name: string; description: string }[] }
    >,
    innateAbilities: mod.innateAbilities as Record<
      string,
      { name: string; description: string }[]
    >,
  };
}

async function carregarVantagens() {
  const mod = await import(moduloDoJogo("rules.ts"));
  return mod.TYPE_ADVANTAGES as Record<string, string[]>;
}

/** Chave estável para deduplicar habilidades escritas inline no mock. */
function chaveDaHabilidade(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** O Supabase limita o tamanho do payload; cargas grandes vão em lotes. */
async function emLotes<T>(itens: T[], tamanho: number, fn: (lote: T[]) => Promise<void>) {
  for (let i = 0; i < itens.length; i += tamanho) {
    await fn(itens.slice(i, i + tamanho));
  }
}

function verificar(etapa: string, error: { message: string } | null) {
  if (error) {
    console.error(`\n✗ ${etapa}: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Confere que o schema aplicado é o esperado antes de carregar qualquer coisa.
 *
 * Existe porque este projeto já teve um dump com nomes de tabela iguais e
 * colunas diferentes. Um upsert contra a estrutura errada falha com mensagem
 * obscura do PostgREST, no meio da carga, com o banco pela metade. Aqui a
 * falha é imediata e diz o que fazer.
 */
async function conferirSchema() {
  const esperado: Record<string, string[]> = {
    pokemon: ["id", "dex_number", "slug", "types", "sprites"],
    pokemon_moves: ["pokemon_id", "move_type", "attack_name", "game_power"],
    type_advantages: ["attacking_type", "defending_type"],
    abilities: ["key", "name", "description"],
    pokemon_abilities: ["pokemon_slug", "ability_id", "position"],
    type_talents: ["type", "name", "description", "position"],
  };

  const problemas: string[] = [];

  for (const [tabela, colunas] of Object.entries(esperado)) {
    // `limit(1)` e NÃO `head: true`. Com head, o PostgREST descarta o corpo:
    // a mensagem do erro vem vazia, e — pior — uma tabela inexistente devolve
    // 204 sem erro nenhum, o que deixaria passar schema faltando.
    const { error } = await db.from(tabela).select(colunas.join(",")).limit(1);
    if (error) {
      problemas.push(
        `  ${tabela.padEnd(18)} ${error.message || error.code || "estrutura inesperada"}`,
      );
    }
  }

  if (problemas.length) {
    console.error("\n✗ O schema no banco não corresponde ao esperado:\n");
    console.error(problemas.join("\n"));
    console.error(
      "\n  Rode apps/api/src/db/schema.sql no SQL Editor do Supabase.",
    );
    console.error("  Atenção: ele é destrutivo, apaga as tabelas atuais.\n");
    process.exit(1);
  }

  console.log("✓ Schema conferido\n");
}

async function main() {
  await conferirSchema();

  console.log("Carregando dados do frontend…");

  const pokemon = JSON.parse(
    readFileSync(join(WEB, "dataset.json"), "utf8"),
  ) as GamePokemon[];
  const { typeTalentTrees, innateAbilities } = await carregarTalentos();
  const advantages = await carregarVantagens();

  console.log(`  ${pokemon.length} Pokémon`);
  console.log(`  ${Object.keys(typeTalentTrees).length} árvores de talento`);
  console.log(`  ${Object.keys(innateAbilities).length} Pokémon com habilidades inatas\n`);

  /* ── Pokémon ───────────────────────────────────────────────────────────── */

  await emLotes(pokemon, 200, async (lote) => {
    const { error } = await db.from("pokemon").upsert(
      lote.map((p) => ({
        id: p.id,
        dex_number: p.dexNumber,
        slug: p.slug,
        types: p.types,
        sprites: p.sprites,
      })),
    );
    verificar("pokemon", error);
  });
  console.log(`✓ pokemon: ${pokemon.length}`);

  /* ── Golpes ────────────────────────────────────────────────────────────── */

  const golpes = pokemon.flatMap((p) =>
    p.moves.map((m) => ({
      pokemon_id: p.id,
      move_type: m.moveType,
      attack_name: m.attackName,
      game_power: m.power,
    })),
  );

  await emLotes(golpes, 500, async (lote) => {
    const { error } = await db.from("pokemon_moves").upsert(lote);
    verificar("pokemon_moves", error);
  });
  console.log(`✓ pokemon_moves: ${golpes.length}`);

  /* ── Vantagens ─────────────────────────────────────────────────────────── */

  const pares = Object.entries(advantages).flatMap(([atacante, defensores]) =>
    defensores.map((d) => ({ attacking_type: atacante, defending_type: d })),
  );
  verificar("type_advantages", (await db.from("type_advantages").upsert(pares)).error);
  console.log(`✓ type_advantages: ${pares.length}`);

  /* ── Talentos por tipo ─────────────────────────────────────────────────── */

  const talentos = Object.entries(typeTalentTrees).flatMap(([tipo, arvore]) =>
    arvore.talents.map((t, i) => ({
      type: tipo,
      name: t.name,
      description: t.description,
      position: i,
    })),
  );
  verificar(
    "type_talents",
    (await db.from("type_talents").upsert(talentos, { onConflict: "type,name" })).error,
  );
  console.log(`✓ type_talents: ${talentos.length}`);

  /* ── Habilidades ───────────────────────────────────────────────────────────
     Aqui está o ganho de normalização: no mock, `innateAbilities` referencia
     um catálogo por chave (A.OVERGROW) mas tem dezenas de entradas escritas
     inline. Deduplicando por nome, as inline entram no catálogo e a repetição
     desaparece. */

  const catalogo = new Map<string, { key: string; name: string; description: string }>();
  for (const lista of Object.values(innateAbilities)) {
    for (const h of lista) {
      const key = chaveDaHabilidade(h.name);
      if (!catalogo.has(key)) {
        catalogo.set(key, { key, name: h.name, description: h.description });
      }
    }
  }

  verificar(
    "abilities",
    (await db.from("abilities").upsert([...catalogo.values()], { onConflict: "key" })).error,
  );

  const { data: salvas, error: erroLeitura } = await db
    .from("abilities")
    .select("id, key");
  verificar("abilities (leitura)", erroLeitura);

  const idPorChave = new Map(salvas!.map((a) => [a.key, a.id]));

  const vinculos = Object.entries(innateAbilities).flatMap(([slug, lista]) =>
    lista
      .map((h, i) => ({
        pokemon_slug: slug,
        ability_id: idPorChave.get(chaveDaHabilidade(h.name))!,
        position: i,
      }))
      // Um Pokémon com a mesma habilidade repetida quebraria a PK composta.
      .filter(
        (v, i, arr) => arr.findIndex((x) => x.ability_id === v.ability_id) === i,
      ),
  );

  await emLotes(vinculos, 500, async (lote) => {
    const { error } = await db.from("pokemon_abilities").upsert(lote);
    verificar("pokemon_abilities", error);
  });

  const totalMock = Object.values(innateAbilities).reduce((a, l) => a + l.length, 0);
  console.log(`✓ abilities: ${catalogo.size} únicas (de ${totalMock} referências no mock)`);
  console.log(`✓ pokemon_abilities: ${vinculos.length}`);

  console.log("\n✓ Banco populado. A regra do jogo agora é consultável por SQL.");
}

main().catch((e) => {
  console.error("\nSeed falhou:", e);
  process.exit(1);
});
