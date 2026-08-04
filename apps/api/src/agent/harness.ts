import { z } from "zod";
import type OpenAI from "openai";
import { llm, MODEL, extrairCusto } from "./llm.js";
import { toolsByName, tools } from "./tools/index.js";
import { SYSTEM_PROMPT } from "./prompt.js";
import { iniciarTrace, registrarPasso, encerrarTrace } from "./trace.js";

/**
 * Harness do agente.
 *
 * É o laço que transforma uma chamada de LLM em um agente:
 *
 *   1. monta o contexto  →  system prompt + histórico + ferramentas
 *   2. chama o modelo
 *   3. veio tool_call?
 *        não → resposta final, encerra
 *        sim → valida os argumentos com Zod
 *              executa com timeout
 *              anexa o resultado ao histórico
 *              volta ao passo 2
 *   4. guardrails a cada volta: maxSteps, orçamento de tokens, timeout global
 *   5. cada passo vira registro em agent_steps
 *
 * Escrito à mão, e não com um framework de agentes, por dois motivos. O
 * prático: este laço é onde moram as decisões que definem custo, latência e
 * confiabilidade — esconder isso atrás de `agent.run()` significa não poder
 * ajustá-las. O de portfólio: o laço é o que se explica numa entrevista.
 */

export interface RunOptions {
  message: string;
  history?: OpenAI.ChatCompletionMessageParam[];
  sessionId?: string;
  /** Teto de idas ao modelo. Impede laço infinito de ferramenta. */
  maxSteps?: number;
  /** Teto de tokens da execução inteira. Impede conta surpresa. */
  tokenBudget?: number;
  /** Teto de tempo total, em ms. */
  timeoutMs?: number;
  /**
   * Sobrescreve o modelo desta execução.
   *
   * Existe para os evals: permite rodar o mesmo conjunto de testes contra
   * vários modelos sem reiniciar a API nem tocar no .env — que é o que torna
   * a comparação de custo versus qualidade viável.
   */
  model?: string;
  /** Recebe cada evento — usado pelo endpoint SSE. */
  onEvent?: (event: AgentEvent) => void;
}

export type AgentEvent =
  | { type: "step"; index: number }
  | { type: "tool_call"; name: string; args: unknown }
  | { type: "tool_result"; name: string; ok: boolean }
  | { type: "text"; content: string }
  | { type: "done"; answer: string; steps: number; tokens: number; costUsd: number | null }
  | { type: "error"; message: string };

export interface RunResult {
  answer: string;
  steps: number;
  totalTokens: number;
  costUsd: number | null;
  status: "ok" | "error" | "max_steps" | "token_budget" | "timeout";
  runId: string | null;
}

/**
 * Zod → JSON Schema, o formato que a API de function calling espera.
 *
 * `io: "input"` é essencial. O padrão do Zod 4 gera o schema do tipo *saída*,
 * onde um campo com `.default()` sempre existe e portanto aparece em
 * `required`. O modelo passaria a ser obrigado a inventar um valor para
 * `limite` em toda chamada, em vez de deixar o padrão agir.
 */
function toOpenAITools(): OpenAI.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: z.toJSONSchema(t.schema, { io: "input" }) as Record<string, unknown>,
    },
  }));
}

/**
 * Uma ferramenta lenta não pode segurar a conversa inteira. O timeout aqui é
 * por chamada; o do laço, mais adiante, cobre a execução como um todo.
 */
async function executarComTimeout(
  nome: string,
  args: unknown,
  ms = 10_000,
): Promise<unknown> {
  const tool = toolsByName.get(nome);
  if (!tool) return { erro: `Ferramenta desconhecida: ${nome}` };

  // Argumento inválido volta como resultado, não como exceção: o modelo lê a
  // mensagem e costuma corrigir sozinho na próxima volta. Derrubar a execução
  // transformaria um erro recuperável em falha da conversa.
  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) {
    return {
      erro: "Argumentos inválidos",
      detalhes: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }

  return Promise.race([
    tool.execute(parsed.data),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${nome} excedeu ${ms}ms`)), ms),
    ),
  ]).catch((e) => ({ erro: e instanceof Error ? e.message : String(e) }));
}

export async function runAgent(options: RunOptions): Promise<RunResult> {
  const {
    message,
    history = [],
    sessionId,
    maxSteps = 8,
    tokenBudget = 30_000,
    timeoutMs = 60_000,
    model = MODEL,
    onEvent,
  } = options;

  const inicio = Date.now();
  const runId = await iniciarTrace({ sessionId, userMessage: message, model });

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: message },
  ];

  let totalTokens = 0;
  let custo: number | null = null;
  let passo = 0;

  try {
    while (passo < maxSteps) {
      if (Date.now() - inicio > timeoutMs) {
        return await finalizar("timeout", "A consulta demorou demais. Tente algo mais específico.");
      }
      if (totalTokens > tokenBudget) {
        // Status próprio: estourar orçamento e estourar número de passos são
        // causas diferentes e pedem investigação diferente. Reportar as duas
        // como "max_steps" esconde qual delas aconteceu — foi o que atrapalhou
        // o diagnóstico da primeira falha encontrada nos evals.
        return await finalizar(
          "token_budget",
          "A consulta consumiu o orçamento de tokens. Tente uma pergunta mais específica.",
        );
      }

      onEvent?.({ type: "step", index: passo });
      const t0 = Date.now();

      const completion = await llm.chat.completions.create({
        model,
        messages,
        tools: toOpenAITools(),
        // "auto" e não "required": muita pergunta ("o que você faz?") não
        // precisa de ferramenta nenhuma, e forçar chamada gera consulta inútil.
        tool_choice: "auto",
        temperature: 0.2,
        // Pede ao OpenRouter o custo real da chamada, em vez de estimarmos
        // a partir de uma tabela de preços que envelhece.
        usage: { include: true },
      } as OpenAI.ChatCompletionCreateParamsNonStreaming);

      totalTokens += completion.usage?.total_tokens ?? 0;
      custo = extrairCusto(completion.usage) ?? custo;

      const choice = completion.choices[0];
      const msg = choice.message;
      messages.push(msg);

      /* Sem tool_call: é a resposta final. */
      if (!msg.tool_calls?.length) {
        const answer = msg.content ?? "";
        onEvent?.({ type: "text", content: answer });

        await registrarPasso(runId, {
          stepIndex: passo,
          role: "assistant",
          tokens: completion.usage?.total_tokens,
          latencyMs: Date.now() - t0,
        });

        return await finalizar("ok", answer);
      }

      /* Ferramentas em paralelo — são leituras independentes. */
      const resultados = await Promise.all(
        msg.tool_calls.map(async (call) => {
          if (call.type !== "function") return null;

          const nome = call.function.name;
          let args: unknown = {};
          try {
            args = JSON.parse(call.function.arguments || "{}");
          } catch {
            // JSON malformado é raro mas acontece; segue com {} para a
            // validação do Zod produzir a mensagem de erro útil.
          }

          onEvent?.({ type: "tool_call", name: nome, args });

          const tInicio = Date.now();
          const resultado = await executarComTimeout(nome, args);
          const ok = !(resultado && typeof resultado === "object" && "erro" in resultado);

          onEvent?.({ type: "tool_result", name: nome, ok });

          await registrarPasso(runId, {
            stepIndex: passo,
            role: "tool",
            toolName: nome,
            toolArgs: args,
            toolResult: resultado,
            latencyMs: Date.now() - tInicio,
          });

          return { call, resultado };
        }),
      );

      for (const r of resultados) {
        if (!r) continue;
        messages.push({
          role: "tool",
          tool_call_id: r.call.id,
          content: JSON.stringify(r.resultado),
        });
      }

      passo++;
    }

    return await finalizar(
      "max_steps",
      "Não consegui concluir em um número razoável de passos. Tente reformular.",
    );
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    onEvent?.({ type: "error", message: mensagem });
    return await finalizar("error", `Erro ao consultar: ${mensagem}`);
  }

  async function finalizar(
    status: RunResult["status"],
    answer: string,
  ): Promise<RunResult> {
    await encerrarTrace(runId, {
      finalAnswer: answer,
      totalTokens,
      costUsd: custo,
      latencyMs: Date.now() - inicio,
      status,
    });

    onEvent?.({ type: "done", answer, steps: passo, tokens: totalTokens, costUsd: custo });

    return { answer, steps: passo, totalTokens, costUsd: custo, status, runId };
  }
}
