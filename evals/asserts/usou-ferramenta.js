/**
 * Asserção de seleção de ferramenta.
 *
 * Verifica no trace se o agente chamou a ferramenta esperada — e não apenas se
 * a resposta parece certa. É a diferença entre acertar e acertar pelo caminho
 * certo: um agente que responde correto sem consultar acertou por sorte, e vai
 * errar quando o dado mudar.
 *
 * O harness devolve `runId`, e o trace fica em agent_steps. Consultamos o
 * Supabase direto, sem instrumentar o código do agente — é exatamente para
 * isto que a tabela de trace existe.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
config({ path: join(AQUI, "../../apps/api/.env") });

const db = createClient(
  process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, ""),
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

export default async function (output, context) {
  const esperada = context?.test?.assert?.config?.esperada ?? context?.config?.esperada;

  let resultado;
  try {
    resultado = typeof output === "string" ? JSON.parse(output) : output;
  } catch {
    return { pass: false, score: 0, reason: "resposta não é JSON válido" };
  }

  if (!resultado.runId) {
    return { pass: false, score: 0, reason: "sem runId — o trace não foi gravado" };
  }

  const { data, error } = await db
    .from("agent_steps")
    .select("tool_name, tool_args")
    .eq("run_id", resultado.runId)
    .not("tool_name", "is", null);

  if (error) {
    return { pass: false, score: 0, reason: `trace inacessível: ${error.message}` };
  }

  const chamadas = (data ?? []).map((s) => s.tool_name);

  if (chamadas.includes(esperada)) {
    return { pass: true, score: 1, reason: `chamou ${esperada}` };
  }

  return {
    pass: false,
    score: 0,
    reason: chamadas.length
      ? `esperava ${esperada}, chamou: ${chamadas.join(", ")}`
      : `esperava ${esperada}, não chamou ferramenta nenhuma`,
  };
}
