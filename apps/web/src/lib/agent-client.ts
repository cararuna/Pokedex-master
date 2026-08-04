/**
 * Cliente do agente — consome o stream SSE da API.
 *
 * ── Por que não `EventSource` ────────────────────────────────────────────
 *
 * A API nativa de SSE do navegador **só faz GET** e não aceita corpo nem
 * cabeçalhos personalizados. Nosso endpoint é POST com a mensagem no corpo —
 * mandar a pergunta na query string a exporia em log de servidor e em
 * histórico de proxy, além do limite de tamanho da URL.
 *
 * Então o parsing do protocolo é feito à mão sobre `fetch`. É menos código do
 * que parece: SSE é texto separado por linha em branco, com campos `event:` e
 * `data:`.
 *
 * ── O detalhe que quebra implementações ingênuas ─────────────────────────
 *
 * Um chunk da rede **não** corresponde a um evento. Um evento pode chegar
 * partido em dois chunks, e dois eventos podem vir no mesmo chunk. Por isso o
 * buffer acumula e só corta em `\n\n` — processar chunk a chunk produz JSON
 * truncado de forma intermitente, que é o bug clássico aqui.
 */

import { API_BASE as API_URL } from "./api-base";

export type AgentEvent =
  | { type: "step"; index: number }
  | { type: "tool_call"; name: string; args: unknown }
  | { type: "tool_result"; name: string; ok: boolean }
  | { type: "text"; content: string }
  | {
      type: "done";
      answer: string;
      steps: number;
      tokens: number;
      costUsd: number | null;
    }
  | { type: "error"; message: string };

export class AgentOfflineError extends Error {
  constructor() {
    super("A API do agente não está respondendo.");
    this.name = "AgentOfflineError";
  }
}

export async function askAgent(
  message: string,
  options: {
    sessionId?: string;
    signal?: AbortSignal;
    onEvent: (event: AgentEvent) => void;
  },
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sessionId: options.sessionId }),
      signal: options.signal,
    });
  } catch (e) {
    // Falha de rede aqui quase sempre significa API fora do ar — dar um erro
    // próprio permite a interface explicar o que fazer, em vez de mostrar
    // "Failed to fetch".
    if (e instanceof DOMException && e.name === "AbortError") return;
    throw new AgentOfflineError();
  }

  if (!response.ok || !response.body) {
    throw new Error(`A API respondeu ${response.status}.`);
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += value;

      // Eventos são separados por linha em branco. O que sobra depois do
      // último separador fica no buffer para o próximo chunk completar.
      let corte: number;
      while ((corte = buffer.indexOf("\n\n")) !== -1) {
        const bruto = buffer.slice(0, corte);
        buffer = buffer.slice(corte + 2);

        const dados = bruto
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5).trim())
          .join("\n");

        if (!dados) continue;

        try {
          options.onEvent(JSON.parse(dados) as AgentEvent);
        } catch {
          // Evento malformado não derruba o stream: o próximo pode ser válido,
          // e perder um "tool_call" é melhor que perder a resposta inteira.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Verifica se a API está no ar, para a interface avisar antes de tentar. */
export async function checkAgentHealth(): Promise<
  { online: true; model: string } | { online: false }
> {
  try {
    const r = await fetch(`${API_URL}/health`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) return { online: false };
    const j = (await r.json()) as { model?: string };
    return { online: true, model: j.model ?? "desconhecido" };
  } catch {
    return { online: false };
  }
}
