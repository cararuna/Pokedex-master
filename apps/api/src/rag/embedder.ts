import { llm } from "../agent/llm.js";
import { llmEnv } from "../env.js";

/**
 * Geração de embeddings.
 *
 * Fica atrás de uma interface por um motivo concreto: **trocar de modelo de
 * embedding é uma migração, não uma configuração.** Vetores de modelos
 * diferentes não são comparáveis — a similaridade entre eles é ruído. Mudar
 * exige recriar a coluna com a dimensão nova e reindexar tudo.
 *
 * Dimensões dos modelos realmente servidos pelo OpenRouter:
 *
 *   openai/text-embedding-3-small    1536   ← em uso
 *   openai/text-embedding-3-large    3072
 *   qwen/qwen3-embedding-8b          4096
 *   google/gemini-embedding-001      3072
 *
 * O `cohere/embed-v1` que aparece em vários tutoriais **não existe** lá.
 */

export const EMBEDDING_DIMENSIONS = 1536;

export interface Embedder {
  readonly model: string;
  readonly dimensions: number;
  embed(textos: string[]): Promise<number[][]>;
}

/** Lote generoso: a chamada é cara por requisição, barata por token. */
const LOTE = 96;

export const openRouterEmbedder: Embedder = {
  get model() {
    return llmEnv().OPENROUTER_EMBEDDING_MODEL;
  },
  dimensions: EMBEDDING_DIMENSIONS,

  async embed(textos) {
    const saida: number[][] = [];

    for (let i = 0; i < textos.length; i += LOTE) {
      const lote = textos.slice(i, i + LOTE);

      const r = await llm.embeddings.create({
        model: this.model,
        input: lote,
      });

      // A API não garante a ordem do array de retorno — o campo `index` é
      // quem amarra cada vetor à sua entrada. Ordenar por ele evita associar
      // o embedding errado ao chunk errado, um bug silencioso e difícil de
      // notar: a busca simplesmente devolve resultados sem sentido.
      const ordenados = [...r.data].sort((a, b) => a.index - b.index);

      for (const item of ordenados) {
        if (item.embedding.length !== EMBEDDING_DIMENSIONS) {
          throw new Error(
            `O modelo ${this.model} devolveu ${item.embedding.length} dimensões, ` +
              `mas a coluna espera ${EMBEDDING_DIMENSIONS}. ` +
              `Rode migration-002-embeddings.sql ajustando a dimensão.`,
          );
        }
        saida.push(item.embedding as number[]);
      }
    }

    return saida;
  },
};
