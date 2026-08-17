/**
 * Administração dos tokens de acesso.
 *
 *   pnpm --filter @pokedex/api token list
 *   pnpm --filter @pokedex/api token create --label "Caio" --role master
 *   pnpm --filter @pokedex/api token revoke --id <uuid>
 *
 * Por que um script e não uma rota de API: para criar o primeiro token pela
 * API seria preciso já ter um token, e o jeito comum de sair desse laço é uma
 * variável de ambiente com um segredo de bootstrap — que é exatamente o
 * segredo compartilhado sem identidade que este desenho veio eliminar.
 *
 * Aqui a credencial que autoriza a emissão é a `SUPABASE_SERVICE_ROLE_KEY`,
 * que já é a chave mais forte do sistema e só existe na máquina de quem
 * mantém. Quem pode rodar isto já podia editar o banco à mão.
 *
 * **O valor em claro é impresso uma vez.** O banco guarda só o SHA-256; não
 * há como recuperá-lo depois. Perdeu, revoga e emite outro.
 */

import { parseArgs } from "node:util";
import { criarToken, listarTokens, revogarToken } from "../src/auth/tokens.js";
import { ROLES, type Role } from "../src/auth/policy.js";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    label: { type: "string" },
    role: { type: "string" },
    id: { type: "string" },
  },
});

const comando = positionals[0];

function uso(): never {
  console.error(`
Uso:
  token list
  token create --label "Nome" --role <${Object.keys(ROLES).join("|")}>
  token revoke --id <uuid>

Papéis:
${Object.entries(ROLES)
  .map(([r, d]) => `  ${r.padEnd(8)} ${d.description}`)
  .join("\n")}
`);
  process.exit(1);
}

async function main() {
  switch (comando) {
    case "list": {
      const tokens = await listarTokens();
      if (tokens.length === 0) {
        console.log("Nenhum token emitido. Crie o primeiro com `token create`.");
        return;
      }
      for (const t of tokens as any[]) {
        const estado = t.revoked_at ? "revogado" : "ativo";
        const uso = t.last_used_at ? new Date(t.last_used_at).toISOString().slice(0, 16) : "nunca";
        console.log(
          `${t.id}  ${String(t.role).padEnd(7)} ${estado.padEnd(9)} usado: ${uso.padEnd(17)} ${t.label}`,
        );
      }
      return;
    }

    case "create": {
      const { label, role } = values;
      if (!label || !role || !(role in ROLES)) uso();

      const { id, plain } = await criarToken({ label, role: role as Role });

      console.log(`\n✓ Token criado para "${label}" (${role})`);
      console.log(`  id: ${id}\n`);
      console.log(`  ${plain}\n`);
      // O aviso não é cerimônia: sem ele, a reação natural é fechar o terminal
      // e pedir o valor de novo — que não existe mais em lugar nenhum.
      console.log("  Copie agora. Este valor não é recuperável — o banco só guarda o hash.\n");
      return;
    }

    case "revoke": {
      if (!values.id) uso();
      const ok = await revogarToken(values.id);
      console.log(ok ? "✓ Revogado." : "Nada a fazer: token inexistente ou já revogado.");
      return;
    }

    default:
      uso();
  }
}

main().catch((e) => {
  console.error("\nFalhou:", e instanceof Error ? e.message : e);
  process.exit(1);
});
