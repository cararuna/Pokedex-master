/**
 * Ingestão — documentação → pgvector.
 *
 * Percorre os documentos em prosa do repositório, divide por heading, gera os
 * embeddings e grava. Depois disto o agente consegue responder perguntas cuja
 * resposta é texto, não linha de tabela:
 *
 *   "Como funciona a árvore de talentos?"
 *   "Por que o valor é comprimido em três degraus?"
 *   "Por que usou @theme inline no design system?"
 *
 * O que NÃO entra aqui: nada que já seja tabela. Pokémon, golpes e vantagens
 * são consultados por SQL. Jogar dado estruturado num índice vetorial é o erro
 * clássico de RAG — vetor mede semelhança, não conta nem ordena.
 *
 * Uso:  pnpm --filter @pokedex/api ingest
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../src/db/client";
import { chunkMarkdown } from "../src/rag/chunk";
import { openRouterEmbedder } from "../src/rag/embedder";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "../../..");

type Kind = "design-system" | "arquitetura" | "regras";

interface Fonte {
  path: string;
  title: string;
  kind: Kind;
}

/**
 * O que é indexado.
 *
 * `kind` permite filtrar a busca: uma pergunta sobre componente não precisa
 * varrer as regras do jogo, e vice-versa.
 */
const FONTES: Fonte[] = [
  { path: "CLAUDE.md", title: "Visão geral do projeto", kind: "regras" },
  { path: "docs/01-arquitetura.md", title: "Arquitetura", kind: "arquitetura" },
  { path: "docs/02-design-system.md", title: "Design system", kind: "design-system" },
  { path: "docs/03-agente-e-harness.md", title: "Agente e harness", kind: "arquitetura" },
  { path: "docs/04-rag.md", title: "RAG", kind: "arquitetura" },
  { path: "docs/05-evals.md", title: "Evals", kind: "arquitetura" },
  { path: "PLANO.md", title: "Plano de refatoração", kind: "arquitetura" },
];

/**
 * As regras do jogo que vivem como dado, mas em forma de prosa.
 *
 * Talentos e habilidades inatas estão em tabela, mas suas descrições são texto
 * livre — "Sempre que infligir ou receber qualquer status, remova o status de
 * um Pokémon da sua equipe". Uma pergunta como "qual talento remove status?"
 * não é respondível por SQL sem busca textual, e é exatamente o caso do RAG.
 */
async function documentoDasRegras(): Promise<string> {
  const [{ data: talentos }, { data: habilidades }] = await Promise.all([
    db.from("type_talents").select("type, name, description, position").order("type").order("position"),
    db.from("abilities").select("name, description").order("name"),
  ]);

  const linhas: string[] = ["# Talentos e habilidades do jogo", ""];

  let tipoAtual = "";
  for (const t of talentos ?? []) {
    if (t.type !== tipoAtual) {
      tipoAtual = t.type;
      linhas.push("", `## Talentos do tipo ${t.type}`, "");
    }
    linhas.push(`- **${t.name}** — ${t.description}`);
  }

  linhas.push("", "## Habilidades inatas", "");
  for (const h of habilidades ?? []) {
    linhas.push(`- **${h.name}** — ${h.description}`);
  }

  return linhas.join("\n");
}

async function main() {
  console.log(`Modelo de embedding: ${openRouterEmbedder.model}`);
  console.log(`Dimensões esperadas: ${openRouterEmbedder.dimensions}\n`);

  // Reingestão completa. Com poucas centenas de chunks é mais simples e mais
  // confiável que detectar o que mudou — e evita o risco de deixar no índice
  // um trecho que não existe mais no documento.
  await db.from("document_chunks").delete().neq("id", 0);
  await db.from("documents").delete().neq("id", 0);

  const documentos: { fonte: Fonte; conteudo: string }[] = [];

  for (const fonte of FONTES) {
    const caminho = join(RAIZ, fonte.path);
    if (!existsSync(caminho)) {
      console.warn(`  ! ausente, pulando: ${fonte.path}`);
      continue;
    }
    documentos.push({ fonte, conteudo: readFileSync(caminho, "utf8") });
  }

  documentos.push({
    fonte: { path: "banco://regras", title: "Talentos e habilidades", kind: "regras" },
    conteudo: await documentoDasRegras(),
  });

  let totalChunks = 0;
  let totalTokens = 0;

  for (const { fonte, conteudo } of documentos) {
    const chunks = chunkMarkdown(conteudo, fonte.title);
    if (chunks.length === 0) continue;

    const { data: doc, error } = await db
      .from("documents")
      .insert({
        source: fonte.path.startsWith("banco://") ? "banco" : "repositorio",
        path: fonte.path,
        title: fonte.title,
        kind: fonte.kind,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  ✗ ${fonte.path}: ${error.message}`);
      continue;
    }

    const vetores = await openRouterEmbedder.embed(chunks.map((c) => c.content));

    const { error: erroChunks } = await db.from("document_chunks").insert(
      chunks.map((c, i) => ({
        document_id: doc.id,
        content: c.content,
        heading_path: c.headingPath,
        embedding: vetores[i] as unknown as string,
        tokens: c.tokens,
      })),
    );

    if (erroChunks) {
      console.error(`  ✗ chunks de ${fonte.path}: ${erroChunks.message}`);
      continue;
    }

    const tokens = chunks.reduce((a, c) => a + c.tokens, 0);
    totalChunks += chunks.length;
    totalTokens += tokens;

    const nome = fonte.path.startsWith("banco://")
      ? fonte.path
      : relative(RAIZ, join(RAIZ, fonte.path)).replace(/\\/g, "/");
    console.log(`  ✓ ${nome.padEnd(32)} ${String(chunks.length).padStart(3)} chunks · ~${tokens} tokens`);
  }

  console.log(`\n✓ ${totalChunks} chunks indexados · ~${totalTokens} tokens`);
  console.log(`  Custo aproximado: US$ ${((totalTokens / 1e6) * 0.02).toFixed(4)}`);
}

main().catch((e) => {
  console.error("\nIngestão falhou:", e);
  process.exit(1);
});
