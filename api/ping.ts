/**
 * Sonda de vida, sem dependência nenhuma.
 *
 * Existe para separar duas perguntas que o erro da Vercel mistura. Quando
 * `/api/*` devolve FUNCTION_INVOCATION_FAILED, não dá para saber se o problema
 * é a plataforma (rota, runtime, empacotamento) ou o nosso código.
 *
 *   /api/ping  falha  →  o problema é a configuração da função
 *   /api/ping  passa e /api/health falha  →  o problema está no nosso grafo
 *
 * Por isso não importa nada: nem Hono, nem Supabase, nem `apps/api`. Só o que
 * o runtime já oferece.
 */
export default {
  fetch: () =>
    Response.json({
      pong: true,
      node: process.version,
      ambiente: process.env.VERCEL ? "vercel" : "local",
    }),
};
