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

function falhar(area: string, issues: { path: PropertyKey[]; message: string }[]): never {
  console.error(`\n✗ Configuração de ${area} inválida em apps/api/.env\n`);
  for (const i of issues) {
    console.error(`  ${i.path.join(".")}: ${i.message}`);
  }
  console.error("\n  Copie apps/api/.env.example e preencha. Veja SETUP.md.\n");
  process.exit(1);
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
  OPENROUTER_EMBEDDING_MODEL: z.string().default("cohere/embed-v1"),
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
