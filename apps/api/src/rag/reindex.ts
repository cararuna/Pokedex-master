import { db } from "../db/client.js";
import { chunkMarkdown } from "./chunk.js";
import { openRouterEmbedder } from "./embedder.js";

/**
 * Reindexação de um documento só.
 *
 * Isto morava dentro de `scripts/ingest-docs.ts`, que apaga **todos** os
 * chunks e reingere tudo. Como script de carga inicial está certo: com poucas
 * centenas de chunks, refazer é mais confiável do que descobrir o que mudou.
 *
 * Como resposta a um pedido de mudança, seria errado por dois motivos. O
 * caro: corrigir a descrição de um talento re-embedaria a documentação
 * inteira, e embedding se paga por token. O grave: entre o `delete` e o fim do
 * `insert` o índice fica vazio, e o agente responde "não encontrei nada sobre
 * isso" para qualquer pergunta — durante segundos, em produção.
 *
 * Aqui a granularidade é o documento. Só o que mudou sai e volta.
 */

export interface FonteDeDocumento {
  path: string;
  title: string;
  kind: "design-system" | "arquitetura" | "regras";
}

/** A fonte que espelha o banco. Ver `documentoDasRegras`. */
export const FONTE_REGRAS: FonteDeDocumento = {
  path: "banco://regras",
  title: "Talentos e habilidades",
  kind: "regras",
};

/**
 * As regras do jogo que vivem em tabela, mas cujo conteúdo é prosa.
 *
 * Talentos e habilidades estão normalizados, mas a descrição é texto livre —
 * "Sempre que infligir ou receber qualquer status, remova o status de um
 * Pokémon da sua equipe". Nenhum SQL responde "qual talento remove status?",
 * e é exatamente o caso do RAG. Por isso o banco vira documento antes de virar
 * vetor.
 */
export async function documentoDasRegras(): Promise<string> {
  const [{ data: talentos }, { data: habilidades }] = await Promise.all([
    db
      .from("type_talents")
      .select("type, name, description, position")
      .order("type")
      .order("position"),
    db.from("abilities").select("name, description").order("name"),
  ]);

  const linhas: string[] = ["# Talentos e habilidades do jogo", ""];

  let tipoAtual = "";
  for (const t of (talentos ?? []) as any[]) {
    if (t.type !== tipoAtual) {
      tipoAtual = t.type;
      linhas.push("", `## Talentos do tipo ${t.type}`, "");
    }
    linhas.push(`- **${t.name}** — ${t.description}`);
  }

  linhas.push("", "## Habilidades inatas", "");
  for (const h of (habilidades ?? []) as any[]) {
    linhas.push(`- **${h.name}** — ${h.description}`);
  }

  return linhas.join("\n");
}

export interface ResultadoDeReindex {
  chunks: number;
  tokens: number;
}

/**
 * Substitui um documento no índice.
 *
 * A ordem importa e é o contrário da intuitiva: **embeda primeiro, apaga
 * depois.** Se o provedor de embedding falhar — e é uma chamada de rede paga,
 * então falha — apagar antes deixaria o documento fora do índice sem nada para
 * repor. Gerando os vetores primeiro, uma falha aborta com o índice antigo
 * ainda inteiro, que é errado mas não é vazio.
 *
 * `documents.path` é único e os chunks têm `on delete cascade`, então trocar o
 * documento leva os chunks junto sem varredura extra.
 */
export async function reindexarDocumento(
  fonte: FonteDeDocumento,
  conteudo: string,
): Promise<ResultadoDeReindex> {
  const chunks = chunkMarkdown(conteudo, fonte.title);
  if (chunks.length === 0) return { chunks: 0, tokens: 0 };

  const vetores = await openRouterEmbedder.embed(chunks.map((c) => c.content));

  await db.from("documents").delete().eq("path", fonte.path);

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

  if (error) throw new Error(`documents: ${error.message}`);

  const { error: erroChunks } = await db.from("document_chunks").insert(
    chunks.map((c, i) => ({
      document_id: (doc as { id: number }).id,
      content: c.content,
      heading_path: c.headingPath,
      embedding: vetores[i] as unknown as string,
      tokens: c.tokens,
    })),
  );

  if (erroChunks) throw new Error(`document_chunks: ${erroChunks.message}`);

  return {
    chunks: chunks.length,
    tokens: chunks.reduce((a, c) => a + c.tokens, 0),
  };
}

/** Regera o documento de regras a partir do banco e o reindexa. */
export async function reindexarRegras(): Promise<ResultadoDeReindex> {
  return reindexarDocumento(FONTE_REGRAS, await documentoDasRegras());
}
