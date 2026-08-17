/**
 * Validação do propositor, contra o modelo de verdade.
 *
 *   pnpm --filter @pokedex/api check:proposer
 *   pnpm --filter @pokedex/api check:proposer -- --model openai/gpt-4o-mini
 *
 * **Não toca o banco.** `proporMudanca` só fala com o modelo, então este
 * script roda antes de qualquer migração — e é justamente a parte mais
 * incerta do caminho: se o `generateObject` negocia bem com o OpenRouter, se
 * o union montado em tempo de execução sobrevive à ida e volta, e se o prompt
 * segura as armadilhas do domínio.
 *
 * Os testes do Vitest cobrem a álgebra, que é determinística. Isto cobre o
 * modelo, que não é — e por isso mede em vez de afirmar.
 *
 * A diferença para os evals do promptfoo: aqueles medem a resposta do agente
 * ao jogador; este mede a tradução de pedido em operação. São dois prompts
 * diferentes, com dois modos de falhar diferentes.
 */

import { parseArgs } from "node:util";
import { proporMudanca } from "../src/changes/proposer.js";
import { parseProposal, OperationError } from "../src/changes/operations.js";
import { ROLES, type Role } from "../src/auth/policy.js";

/**
 * Três desfechos possíveis, e a distinção é o produto:
 *
 *   operacao   o pedido era claro     → propõe
 *   recusa     não dá para fazer      → `unsupported`
 *   duvida     mais de um alvo servia → pergunta, e não chuta
 */
type Espera =
  | { tipo: "operacao"; kind: string; args?: Record<string, unknown> }
  | { tipo: "recusa" }
  | { tipo: "duvida"; candidatos: string[] };

interface Caso {
  pedido: string;
  espera: Espera;
  papel?: Role;
  /** O que este caso vigia. Aparece no relatório quando falha. */
  guarda: string;
}

const CASOS: Caso[] = [
  {
    pedido: "Charizard's fire attack should be worth 10 instead of 9",
    espera: {
      tipo: "operacao",
      kind: "update_move_power",
      args: { pokemon_slug: "charizard", move_type: "fire", game_power: 10 },
    },
    guarda: "o caso central: pedido direto de valor vira a operação de valor",
  },
  {
    pedido: "Rename Bulbasaur's grass attack to solar-beam",
    espera: {
      tipo: "operacao",
      kind: "rename_move",
      args: { pokemon_slug: "bulbasaur", move_type: "grass", attack_name: "solar-beam" },
    },
    guarda: "nome e valor são operações distintas e não podem ser confundidas",
  },
  {
    pedido:
      "Change the grass talent Leech Seed so it reads: whenever you inflict or receive a status, remove one status from a teammate",
    espera: { tipo: "operacao", kind: "update_talent_text", args: { type: "grass" } },
    guarda: "talento de tipo é update_talent_text, não habilidade inata",
  },
  {
    pedido: "The Blaze ability description should say: +1 on Fire attacks",
    espera: { tipo: "operacao", kind: "update_ability_text", args: { ability_name: "Blaze" } },
    guarda: "habilidade inata é update_ability_text — a distinção que a mesa usa",
  },

  /* ── As recusas. É onde este script paga por si ────────────────────────── */

  {
    pedido: "Set Charizard's fire attack to 90",
    espera: { tipo: "recusa" },
    guarda:
      "90 é o dano da série. Converter na marra seria escrever um número que a mesa não usa",
  },
  {
    pedido: "Add Mewtwo to the game with a psychic attack of 10",
    espera: { tipo: "recusa" },
    guarda: "criar linha não está no cardápio, e forçar encaixe é o pior modo de falhar",
  },
  {
    pedido: "Delete every fire talent",
    espera: { tipo: "recusa" },
    guarda: "remoção em massa não existe aqui e não pode virar um update qualquer",
  },
  {
    pedido: "Give Charizard a second fire attack called ember worth 8",
    espera: { tipo: "recusa" },
    guarda: "um golpe por tipo é regra do jogo, e a chave primária a sustenta",
  },

  /* ── Aterramento: descrever o efeito em vez do nome ────────────────────── */

  {
    pedido: "Charizard's ability about sunny day should give +2 instead of +1",
    espera: { tipo: "operacao", kind: "update_ability_text", args: { ability_name: "Poder Solar" } },
    guarda:
      "achar pelo efeito, não pelo nome — é o que o retrieval trouxe e o prompt sozinho não fazia",
  },

  /* ── Desambiguação ─────────────────────────────────────────────────────── */

  {
    pedido: "The Charizard ability that gives +1 to fire attacks should give +2",
    espera: { tipo: "duvida", candidatos: ["Blaze", "Chama Potente"] },
    guarda:
      "Blaze (inata) e Chama Potente (talento fire) têm a MESMA descrição no banco. " +
      "A informação para escolher não está no pedido, então perguntar é a única resposta certa",
  },

  {
    pedido: "Charizard's fire attack should be worth 10",
    papel: "editor",
    espera: { tipo: "recusa" },
    guarda: "editor não enxerga a operação de valor, então recusa sozinho — sem custo extra",
  },
  {
    pedido: "The Blaze ability description should say: +1 on Fire attacks",
    papel: "editor",
    espera: { tipo: "operacao", kind: "update_ability_text", args: { ability_name: "Blaze" } },
    guarda: "e o que o editor pode fazer continua funcionando",
  },
];

const { values } = parseArgs({ options: { model: { type: "string" } } });

/** Só os campos declarados no caso são comparados; o resto é livre. */
function argsConferem(esperado: Record<string, unknown>, recebido: Record<string, unknown>) {
  return Object.entries(esperado).every(([k, v]) => {
    const atual = recebido[k];
    return typeof v === "string" && typeof atual === "string"
      ? atual.toLowerCase() === v.toLowerCase()
      : atual === v;
  });
}

async function main() {
  console.log(`\nPropositor — validação contra o modelo`);
  if (values.model) console.log(`Modelo forçado: ${values.model}`);
  console.log("");

  let passou = 0;
  let custo = 0;
  const falhas: string[] = [];

  for (const caso of CASOS) {
    const papel = caso.papel ?? "master";
    const rotulo = `${papel.padEnd(6)} ${caso.pedido.slice(0, 58).padEnd(58)}`;

    try {
      const r = await proporMudanca(caso.pedido, {
        model: values.model,
        kinds: ROLES[papel].operationKinds,
      });
      custo += r.costUsd ?? 0;

      /** O que de fato veio, em uma palavra — para o relatório de falha. */
      const veio = r.clarification
        ? `perguntou (${r.clarification.candidates.length})`
        : r.proposal
          ? r.proposal.kind
          : "recusou";

      if (caso.espera.tipo === "recusa") {
        if (!r.proposal && !r.clarification) {
          console.log(`  ✓ ${rotulo} recusou`);
          passou++;
        } else {
          console.log(`  ✗ ${rotulo} ${veio}`);
          falhas.push(`"${caso.pedido}" — devia recusar (${caso.guarda})`);
        }
        continue;
      }

      if (caso.espera.tipo === "duvida") {
        const nomes = (r.clarification?.candidates ?? []).map((c) => c.label);
        // Compara por prefixo: o rótulo carrega o mecanismo ("Blaze — innate
        // ability"), e o caso declara só o nome, que é o que identifica a linha.
        const cobre = caso.espera.candidatos.every((esperado) =>
          nomes.some((n) => n.toLowerCase().startsWith(esperado.toLowerCase())),
        );

        if (r.clarification && cobre) {
          console.log(`  ✓ ${rotulo} perguntou: ${nomes.join(" | ")}`);
          passou++;
        } else {
          console.log(`  ✗ ${rotulo} ${veio}`);
          falhas.push(
            `"${caso.pedido}" — esperava dúvida entre ${caso.espera.candidatos.join(" e ")}, ` +
              `veio ${veio}${nomes.length ? ` [${nomes.join(" | ")}]` : ""} (${caso.guarda})`,
          );
        }
        continue;
      }

      if (!r.proposal) {
        console.log(`  ✗ ${rotulo} ${veio}`);
        falhas.push(
          `"${caso.pedido}" — não propôs o que devia: ${r.unsupportedReason ?? r.clarification?.question}`,
        );
        continue;
      }

      // A proposta tem de sobreviver ao registro, não só ao schema da chamada.
      const { proposal } = parseProposal(r.proposal);

      if (proposal.kind !== caso.espera.kind) {
        console.log(`  ✗ ${rotulo} ${proposal.kind}`);
        falhas.push(
          `"${caso.pedido}" — esperava ${caso.espera.kind}, veio ${proposal.kind} (${caso.guarda})`,
        );
        continue;
      }

      if (caso.espera.args && !argsConferem(caso.espera.args, proposal.args)) {
        console.log(`  ✗ ${rotulo} ${proposal.kind} com args errados`);
        falhas.push(
          `"${caso.pedido}" — args: esperava ${JSON.stringify(caso.espera.args)}, veio ${JSON.stringify(proposal.args)}`,
        );
        continue;
      }

      console.log(`  ✓ ${rotulo} ${proposal.kind}`);
      passou++;
    } catch (e) {
      console.log(`  ✗ ${rotulo} erro`);
      falhas.push(
        `"${caso.pedido}" — ${e instanceof OperationError ? e.message : String(e)}`,
      );
    }
  }

  console.log(`\n${passou}/${CASOS.length} · custo US$ ${custo.toFixed(4)}\n`);

  if (falhas.length) {
    console.log("Falhas:");
    for (const f of falhas) console.log(`  · ${f}`);
    console.log("");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\nFalhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
