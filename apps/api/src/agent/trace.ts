import { db } from "../db/client.js";

/**
 * Observabilidade do agente.
 *
 * Cada execução vira uma linha em `agent_runs` e cada passo uma linha em
 * `agent_steps`. Não é enfeite:
 *
 *   · alimenta os evals (Fase 6) — dá para conferir se a ferramenta certa foi
 *     chamada, com os argumentos certos, sem instrumentar o teste;
 *   · mostra custo e latência reais por conversa, em vez de estimativa;
 *   · quando alguém diz "o bot errou", existe o passo a passo do que ele
 *     consultou. Sem isso, depurar agente é adivinhação.
 *
 * Falha de trace nunca derruba a execução: observabilidade que quebra o
 * produto observado é pior que observabilidade nenhuma. Todas as funções aqui
 * engolem o erro e seguem.
 */

export async function iniciarTrace(dados: {
  sessionId?: string;
  userMessage: string;
  model: string;
}): Promise<string | null> {
  try {
    const { data, error } = await db
      .from("agent_runs")
      .insert({
        session_id: dados.sessionId ?? null,
        user_message: dados.userMessage,
        model: dados.model,
        status: "ok", // corrigido no encerramento
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id as string;
  } catch (e) {
    console.warn("[trace] não foi possível iniciar:", e);
    return null;
  }
}

export async function registrarPasso(
  runId: string | null,
  passo: {
    stepIndex: number;
    role: string;
    toolName?: string;
    toolArgs?: unknown;
    toolResult?: unknown;
    tokens?: number;
    latencyMs?: number;
  },
): Promise<void> {
  if (!runId) return;
  try {
    await db.from("agent_steps").insert({
      run_id: runId,
      step_index: passo.stepIndex,
      role: passo.role,
      tool_name: passo.toolName ?? null,
      tool_args: passo.toolArgs ?? null,
      // Resultado de ferramenta pode ser grande (uma busca devolve 50 linhas).
      // Truncar aqui evita inchar o banco de trace sem perder o essencial
      // para depuração: quais argumentos e que forma tinha a resposta.
      tool_result: truncar(passo.toolResult),
      tokens: passo.tokens ?? null,
      latency_ms: passo.latencyMs ?? null,
    });
  } catch (e) {
    console.warn("[trace] passo não registrado:", e);
  }
}

export async function encerrarTrace(
  runId: string | null,
  dados: {
    finalAnswer: string;
    totalTokens: number;
    costUsd: number | null;
    latencyMs: number;
    status: string;
  },
): Promise<void> {
  if (!runId) return;
  try {
    await db
      .from("agent_runs")
      .update({
        final_answer: dados.finalAnswer,
        total_tokens: dados.totalTokens,
        cost_usd: dados.costUsd,
        latency_ms: dados.latencyMs,
        status: dados.status,
      })
      .eq("id", runId);
  } catch (e) {
    console.warn("[trace] não foi possível encerrar:", e);
  }
}

const LIMITE = 4000;

function truncar(valor: unknown): unknown {
  if (valor === undefined || valor === null) return null;
  const json = JSON.stringify(valor);
  if (json.length <= LIMITE) return valor;
  return {
    _truncado: true,
    _tamanho_original: json.length,
    amostra: json.slice(0, LIMITE),
  };
}
