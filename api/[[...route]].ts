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
import app from "../apps/api/src/index";

/**
 * Configuração da função, declarada aqui e não no vercel.json.
 *
 * A chave `functions` do vercel.json usa glob, e `[` e `]` são sintaxe de
 * classe de caracteres — o padrão "api/[[...route]].ts" não casa com o arquivo
 * de mesmo nome, e o deploy falha com "the pattern doesn't match any
 * Serverless Functions". Exportar daqui evita o problema por completo.
 *
 * O harness tem timeout interno de 60s; a plataforma precisa acompanhar.
 */
export const maxDuration = 60;

const vercel = new Hono().route("/api", app);

/**
 * O formato do export é o que decide como a Vercel chama a função.
 *
 * Um `export default` que seja uma **função** é lido como handler Node clássico
 * e recebe `(IncomingMessage, ServerResponse)`. Um `export default` que seja um
 * **objeto com `fetch`** é lido como Web Handler e recebe um `Request` padrão.
 *
 * Exportar `handle()` do `hono/vercel` cai no primeiro caso: aquele adaptador é
 * do Next.js, onde a convenção já é Web. Aqui a função recebia um
 * `IncomingMessage` onde esperava um `Request` e estourava no cold start —
 * FUNCTION_INVOCATION_FAILED em toda rota, `/health` incluído.
 *
 * `app.fetch` já é Web padrão, então o objeto abaixo dispensa adaptador. O
 * wrapper existe para passar só o `Request`: o segundo argumento do `fetch` do
 * Hono é o `env` das rotas, e entregar o contexto da plataforma ali mudaria o
 * significado de `c.env` sem necessidade.
 */
export default {
  fetch: (request: Request) => vercel.fetch(request),
};
