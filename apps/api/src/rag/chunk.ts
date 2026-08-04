/**
 * Divisão de documentos em pedaços.
 *
 * É a decisão que mais afeta a qualidade do RAG, e a menos discutida. Um corte
 * ruim produz trechos que o modelo não consegue usar mesmo quando a busca os
 * encontra.
 *
 * ── Estratégia: por heading, preservando a hierarquia ────────────────────
 *
 * Cada pedaço carrega o caminho de títulos até ele:
 *
 *   "Design system › As três camadas › Camada 2 — semântica"
 *
 * Duas razões:
 *
 *   1. Contexto. Um trecho solto dizendo "é esta indireção que faz o tema
 *      escuro existir" não diz de que indireção se trata. O caminho conta.
 *
 *   2. Citação. A resposta pode dizer de onde veio, e a pessoa confere.
 *
 * ── Alternativas descartadas ─────────────────────────────────────────────
 *
 *   tamanho fixo      corta no meio de frase e de bloco de código
 *   documento inteiro estoura contexto e dilui a similaridade
 *   por parágrafo     perde a relação entre parágrafos da mesma seção
 */

export interface Chunk {
  content: string;
  headingPath: string;
  /** Estimativa grosseira, só para inspeção — não é contagem real. */
  tokens: number;
}

/** ~4 caracteres por token em português. Serve para relatório, não para corte. */
const estimarTokens = (t: string) => Math.ceil(t.length / 4);

/**
 * Teto de tamanho. Seções muito longas são quebradas em parágrafos, mas
 * **nunca** dentro de um bloco de código: metade de um exemplo é pior que
 * exemplo nenhum.
 */
const MAX_CHARS = 2400;
const MIN_CHARS = 120;

export function chunkMarkdown(markdown: string, tituloDoDoc: string): Chunk[] {
  const linhas = markdown.split("\n");

  const chunks: Chunk[] = [];
  const pilha: string[] = []; // hierarquia de títulos corrente
  let buffer: string[] = [];
  let dentroDeCodigo = false;

  const despejar = () => {
    const texto = buffer.join("\n").trim();
    buffer = [];
    if (texto.length < MIN_CHARS) return; // fragmento sem substância

    const caminho = [tituloDoDoc, ...pilha].join(" › ");

    for (const parte of quebrarSeGrande(texto)) {
      chunks.push({
        content: parte,
        headingPath: caminho,
        tokens: estimarTokens(parte),
      });
    }
  };

  for (const linha of linhas) {
    // Cerca de bloco de código: dentro dela, `#` é comentário, não título.
    if (/^\s*```/.test(linha)) {
      dentroDeCodigo = !dentroDeCodigo;
      buffer.push(linha);
      continue;
    }

    const titulo = !dentroDeCodigo && /^(#{1,4})\s+(.*)$/.exec(linha);

    if (titulo) {
      despejar();
      const nivel = titulo[1].length;
      // Ajusta a pilha ao nível do título: um h2 descarta os h3 anteriores.
      pilha.length = Math.max(0, nivel - 1);
      pilha[nivel - 1] = titulo[2].replace(/[#*`]/g, "").trim();
      continue;
    }

    buffer.push(linha);
  }

  despejar();
  return chunks;
}

/**
 * Quebra por parágrafo quando a seção passa do teto, mantendo blocos de código
 * inteiros. Um bloco sozinho maior que o teto é preservado como está — cortá-lo
 * destruiria justamente o que ele tem de útil.
 */
function quebrarSeGrande(texto: string): string[] {
  if (texto.length <= MAX_CHARS) return [texto];

  const blocos = texto.split(/\n\n+/);
  const partes: string[] = [];
  let atual = "";

  for (const bloco of blocos) {
    if (atual && atual.length + bloco.length + 2 > MAX_CHARS) {
      partes.push(atual.trim());
      atual = "";
    }
    atual += (atual ? "\n\n" : "") + bloco;
  }

  if (atual.trim()) partes.push(atual.trim());
  return partes;
}
