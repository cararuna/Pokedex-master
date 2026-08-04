import "dotenv/config";
import { z } from "zod";

/**
 * Configuração, validada por área.
 *
 * A separação existe por um motivo prático: o script de seed não usa LLM
 * nenhuma, e exigir a chave do OpenRouter para popular o banco travaria uma
 * tarefa numa credencial que ela não precisa. Cada parte do sistema valida só
 * o que consome.
 *
 * A validação é sempre na partida, nunca no meio de uma requisição: chave
 * faltando é erro de configuração e deve falhar cedo, com mensagem clara.
 */

/** Erro de configuração, com as variáveis que faltam. */
export class ConfigError extends Error {
  constructor(
    readonly area: string,
    readonly faltando: string[],
  ) {
    super(`Configuração de ${area} inválida: ${faltando.join(", ")}`);
    this.name = "ConfigError";
  }
}

/**
 * `process.exit(1)` está certo num servidor que sobe pela linha de comando —
 * falha cedo, alto e visível. Numa função serverless é o oposto: mata o
 * processo, a plataforma devolve 500 sem corpo, e não há como saber qual
 * variável faltou.
 *
 * Então: encerra o processo em execução local, lança em serverless. Quem
 * captura é o app, que responde com a lista do que está faltando.
 */
function falhar(area: string, issues: { path: PropertyKey[]; message: string }[]): never {
  const faltando = issues.map((i) => `${i.path.join(".")} (${i.message})`);

  if (process.env.VERCEL) {
    throw new ConfigError(area, faltando);
  }

  console.error(`\n✗ Configuração de ${area} inválida em apps/api/.env\n`);
  for (const f of faltando) console.error(`  ${f}`);
  console.error("\n  Copie apps/api/.env.example e preencha. Veja SETUP.md.\n");
  process.exit(1);
}

/** Diz o que está configurado sem lançar — usado pelo /health. */
export function statusDaConfiguracao() {
  const supabase = supabaseSchema.safeParse(process.env);
  const llm = llmSchema.safeParse(process.env);
  return {
    supabase: supabase.success,
    openrouter: llm.success,
    faltando: [
      ...(supabase.success ? [] : supabase.error.issues.map((i) => String(i.path[0]))),
      ...(llm.success ? [] : llm.error.issues.map((i) => String(i.path[0]))),
    ],
  };
}

/* ── Supabase ─────────────────────────────────────────────────────────────── */

const supabaseSchema = z.object({
  SUPABASE_URL: z
    .string()
    .url("precisa ser a URL do projeto")
    // O painel do Supabase mostra a URL da API REST em alguns lugares. O
    // cliente JS quer só a origem e monta /rest/v1 sozinho — colar a URL
    // completa produz caminhos duplicados e 404 difícil de diagnosticar.
    .transform((u) => u.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "")),

  /**
   * Ignora todas as regras de RLS. Só o backend pode conhecê-la.
   * Aceita os dois formatos: o JWT antigo (`eyJ…`) e o novo (`sb_secret_…`).
   */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "chave ausente ou curta demais"),
});

let supabaseCache: z.infer<typeof supabaseSchema> | null = null;

export function supabaseEnv() {
  if (supabaseCache) return supabaseCache;
  const r = supabaseSchema.safeParse(process.env);
  if (!r.success) falhar("Supabase", r.error.issues);
  supabaseCache = r.data;
  return r.data;
}

/* ── OpenRouter ───────────────────────────────────────────────────────────── */

const llmSchema = z.object({
  OPENROUTER_API_KEY: z.string().startsWith("sk-or-", "chave do OpenRouter inválida"),

  /**
   * Modelo em variável de ambiente de propósito: trocar de modelo para
   * comparar custo e qualidade nos evals vira mudança de config, não de código.
   */
  OPENROUTER_MODEL: z.string().default("anthropic/claude-sonnet-4.5"),
  OPENROUTER_EMBEDDING_MODEL: z.string().default("openai/text-embedding-3-small"),
});

let llmCache: z.infer<typeof llmSchema> | null = null;

export function llmEnv() {
  if (llmCache) return llmCache;
  const r = llmSchema.safeParse(process.env);
  if (!r.success) falhar("OpenRouter", r.error.issues);
  llmCache = r.data;
  return r.data;
}

/* ── Servidor ─────────────────────────────────────────────────────────────── */

const serverSchema = z.object({
  PORT: z.coerce.number().default(8787),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
});

export const serverEnv = serverSchema.parse(process.env);
