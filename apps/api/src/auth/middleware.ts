import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { resolverAtor, tokenDoRequest, type Actor } from "./tokens.js";
import { ROLES, temCapacidade, type Capability } from "./policy.js";

/**
 * Autenticação e autorização das rotas de escrita.
 *
 * A separação entre os dois códigos importa e é o tipo de coisa que se erra
 * por descuido:
 *
 *   401  não sei quem você é      → o cliente pede o token
 *   403  sei quem você é, e não   → o cliente mostra "seu papel não permite"
 *
 * Responder 403 para quem não mandou token faria a tela pedir permissão a
 * alguém que só precisava se identificar; responder 401 para quem se
 * identificou faria a tela pedir o token de novo, num laço que nunca resolve.
 */

export type ComAtor = { Variables: { actor: Actor } };

export function exigir(capacidade: Capability) {
  return createMiddleware<ComAtor>(async (c, next) => {
    const ator = await resolverAtor(tokenDoRequest(c.req.raw.headers));

    if (!ator) {
      return c.json(
        {
          erro: "Missing or invalid access token.",
          dica: "Send it as `Authorization: Bearer pkdx_…`.",
        },
        401,
      );
    }

    if (!temCapacidade(ator.role, capacidade)) {
      return c.json(
        {
          erro: `Your role (${ator.role}) cannot perform "${capacidade}".`,
          papel: ROLES[ator.role].description,
        },
        403,
      );
    }

    c.set("actor", ator);
    await next();
  });
}

/** O ator já resolvido pelo middleware. Só chame em rota que passou por ele. */
export function atorDe(c: Context<ComAtor>): Actor {
  return c.get("actor");
}
