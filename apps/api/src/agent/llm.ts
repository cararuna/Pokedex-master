import OpenAI from "openai";
import { llmEnv, serverEnv } from "../env";

/**
 * Cliente de LLM — SDK da OpenAI apontado para o OpenRouter.
 *
 * O OpenRouter expõe a mesma interface da OpenAI, então o SDK oficial funciona
 * trocando só a `baseURL`. Ganhamos tipagem, streaming, retry e paginação de
 * graça, e mantemos a liberdade de trocar de modelo por variável de ambiente.
 *
 * Por que OpenRouter e não a API direta de um fornecedor: uma chave e uma
 * fatura para dezenas de modelos, e trocar de modelo vira mudança de config.
 * É o que torna viável rodar o mesmo eval contra quatro modelos e comparar
 * custo versus qualidade (Fase 6).
 */
const env = llmEnv();

export const llm = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    // O OpenRouter usa estes cabeçalhos para atribuir uso e listar o app no
    // ranking público. São opcionais, mas ajudam a rastrear consumo.
    "HTTP-Referer": serverEnv.WEB_ORIGIN,
    "X-Title": "Pokédex — companion de jogo de tabuleiro",
  },
  // O SDK já faz recuo exponencial. 2 tentativas cobrem instabilidade
  // passageira sem transformar um erro real numa espera longa.
  maxRetries: 2,
});

export const MODEL = env.OPENROUTER_MODEL;
export const EMBEDDING_MODEL = env.OPENROUTER_EMBEDDING_MODEL;

/**
 * Custo da execução, quando o provedor informa.
 *
 * O OpenRouter devolve o custo real em `usage.cost` — não é estimativa nossa
 * baseada numa tabela de preços que envelhece. Nem todo modelo preenche o
 * campo, daí o retorno anulável.
 */
export function extrairCusto(usage: unknown): number | null {
  if (usage && typeof usage === "object" && "cost" in usage) {
    const cost = (usage as { cost: unknown }).cost;
    if (typeof cost === "number") return cost;
  }
  return null;
}
