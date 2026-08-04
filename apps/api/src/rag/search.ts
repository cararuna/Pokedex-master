import { db } from "../db/client.js";
import { openRouterEmbedder } from "./embedder.js";

/**
 * Busca vetorial.
 *
 * A pergunta vira vetor pelo mesmo modelo que gerou os vetores do índice —
 * usar modelos diferentes nos dois lados produz resultados aleatórios, porque
 * os espaços não são comparáveis.
 */

export interface Trecho {
  content: string;
  heading_path: string | null;
  title: string;
  path: string;
  similarity: number;
}

/**
 * Corte de similaridade.
 *
 * A busca vetorial **sempre** devolve os k mais próximos, mesmo quando nada é
 * relevante — não existe "não encontrei". Sem um piso, uma pergunta fora de
 * escopo traria os trechos menos ruins e o modelo responderia com base neles,
 * o que é pior que admitir que não sabe.
 *
 * 0.25 saiu da medição feita neste projeto: pares de frases sobre assuntos
 * diferentes ficaram em ~0.20, e pares relacionados a partir de ~0.45.
 */
const PISO_DE_SIMILARIDADE = 0.25;

export async function buscarTrechos(
  pergunta: string,
  opcoes: { limite?: number; kind?: string | null } = {},
): Promise<Trecho[]> {
  const { limite = 5, kind = null } = opcoes;

  const [vetor] = await openRouterEmbedder.embed([pergunta]);

  const { data, error } = await db.rpc("match_chunks", {
    query_embedding: vetor as unknown as string,
    match_count: limite,
    filter_kind: kind,
  });

  if (error) throw new Error(`Busca vetorial falhou: ${error.message}`);

  return ((data ?? []) as Trecho[]).filter(
    (t) => t.similarity >= PISO_DE_SIMILARIDADE,
  );
}
