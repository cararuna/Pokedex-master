/**
 * Entrypoint serverless da Vercel.
 *
 * A Vercel trata qualquer arquivo em `/api` na raiz como função. O nome
 * `[[...route]]` é a rota curinga opcional: uma única função atende
 * `/api/pokemon`, `/api/agent/chat` e tudo mais, em vez de um arquivo por
 * endpoint. Assim o app Hono continua sendo um só — o mesmo que roda em
 * `pnpm dev:api` — e não existe uma versão "de produção" divergente.
 *
 * O `.route("/api", app)` monta o app sob o prefixo. Em desenvolvimento o
 * servidor local serve na raiz (`http://localhost:8787/pokemon`); em produção
 * a Vercel entrega em `/api/pokemon`. Montar aqui, e não com `basePath` dentro
 * do app, mantém os dois ambientes com o mesmo código de rota.
 */

import { Hono } from "hono";
import { handle } from "hono/vercel";
import app from "../apps/api/src/index";

// Node, não Edge: o cliente do Supabase e o SDK da OpenAI dependem de APIs do
// Node que o runtime Edge não expõe.
export const config = { runtime: "nodejs" };

const vercel = new Hono().route("/api", app);

export default handle(vercel);
