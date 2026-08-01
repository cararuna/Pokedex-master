import "dotenv/config";
import { z } from "zod";

/**
 * Configuração validada na partida.
 *
 * O processo morre agora, com mensagem clara, em vez de quebrar na primeira
 * requisição com um `undefined` no meio de uma chamada HTTP. Chave faltando é
 * erro de configuração, não erro de runtime.
 */
const schema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL precisa ser a URL do projeto"),

  /**
   * Ignora todas as regras de RLS. Só o backend pode conhecê-la — se aparecer
   * no bundle do frontend, qualquer pessoa lê e escreve o banco inteiro.
   */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "service_role key ausente"),

  OPENROUTER_API_KEY: z.string().startsWith("sk-or-", "key do OpenRouter inválida"),

  /**
   * Modelo do agente. Sai de variável de ambiente de propósito: trocar de
   * modelo para comparar custo e qualidade nos evals vira mudança de config,
   * não de código.
   */
  OPENROUTER_MODEL: z.string().default("anthropic/claude-sonnet-4.5"),
  OPENROUTER_EMBEDDING_MODEL: z.string().default("cohere/embed-v1"),

  PORT: z.coerce.number().default(8787),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n✗ Configuração inválida em apps/api/.env\n");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("\n  Copie apps/api/.env.example e preencha. Veja SETUP.md.\n");
  process.exit(1);
}

export const env = parsed.data;
