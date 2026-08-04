/**
 * Servidor de desenvolvimento.
 *
 * Só existe para `pnpm dev:api`. Na Vercel o app é servido por
 * `api/[[...route]].ts`, que entrega o `fetch` do Hono ao runtime — não há
 * porta para abrir, e `@hono/node-server` não chega nem a entrar no pacote da
 * função.
 *
 * O app em si mora em `index.ts` e é o mesmo nos dois casos: as rotas não
 * sabem em qual dos dois estão rodando.
 */
import { serve } from "@hono/node-server";
import app, { agenteConfigurado } from "./index";
import { serverEnv } from "./env";

serve({ fetch: app.fetch, port: serverEnv.PORT }, (info) => {
  console.log(`\n  API em http://localhost:${info.port}`);
  console.log(`  Catálogo: pronto`);
  console.log(
    `  Agente:   ${
      agenteConfigurado()
        ? process.env.OPENROUTER_MODEL
        : "não configurado (falta OPENROUTER_API_KEY)"
    }\n`,
  );
});
