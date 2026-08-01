import { createClient } from "@supabase/supabase-js";
import { env } from "../env";

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
export const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
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
