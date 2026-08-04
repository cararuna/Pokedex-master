import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "../env";

/**
 * Cliente do Supabase com a service_role.
 *
 * Ignora RLS por definição — por isso vive só aqui, no backend. O frontend
 * nunca fala com o Supabase diretamente: fala com esta API, que decide o que
 * expor. Assim as regras de acesso ficam num lugar só, em código revisável,
 * em vez de espalhadas entre policies e chamadas do cliente.
 *
 * `persistSession: false` porque não há usuário logado nesta conexão: é
 * processo de servidor, não navegador.
 */
/**
 * Inicialização preguiçosa.
 *
 * Criar o cliente no topo do módulo fazia a validação de ambiente rodar no
 * import — e, sem as variáveis, a função serverless morria antes de qualquer
 * rota executar. Resultado: 500 sem corpo, inclusive no /health, que existe
 * justamente para dizer o que está faltando.
 *
 * Com o Proxy, o cliente só é construído na primeira consulta de verdade, e
 * o erro de configuração vira uma resposta HTTP legível.
 */
let instancia: SupabaseClient | null = null;

function cliente(): SupabaseClient {
  if (!instancia) {
    const env = supabaseEnv();
    instancia = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return instancia;
}

export const db = new Proxy({} as SupabaseClient, {
  get(_alvo, prop, receber) {
    const real = cliente();
    const valor = Reflect.get(real, prop, receber);
    // Métodos precisam do `this` correto: `db.from(...)` chamado pelo Proxy
    // perderia o contexto e quebraria dentro do SDK.
    return typeof valor === "function" ? valor.bind(real) : valor;
  },
});

/* ── Formato dos registros ────────────────────────────────────────────────── */

export interface PokemonRow {
  id: number;
  dex_number: number;
  slug: string;
  types: string[];
  sprites: Record<string, string | null>;
}

export interface MoveRow {
  pokemon_id: number;
  move_type: string;
  attack_name: string;
  game_power: number;
}
