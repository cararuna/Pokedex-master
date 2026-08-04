/**
 * Entrypoint serverless da Vercel.
 *
 * A Vercel trata qualquer arquivo em `/api` na raiz como função. O nome
 * `[...route]` é a rota curinga: uma única função atende `/api/pokemon`,
 * `/api/agent/chat` e tudo mais, em vez de um arquivo por endpoint. Assim o
 * app Hono continua sendo um só — o mesmo que roda em `pnpm dev:api` — e não
 * existe uma versão "de produção" divergente.
 *
 * Um colchete, e não dois. `[[...route]]` é a curinga *opcional*, e essa é uma
 * convenção do Next.js: fora dele a Vercel casava só o primeiro segmento.
 * `/api/pokemon` respondia e `/api/pokemon/bulbasaur` dava 404 — o verso da
 * carta ficava sem talentos e o chat do agente aparecia como offline, os dois
 * pela mesma causa.
 *
 * O `.route("/api", app)` monta o app sob o prefixo. Em desenvolvimento o
 * servidor local serve na raiz (`http://localhost:8787/pokemon`); em produção
 * a Vercel entrega em `/api/pokemon`. Montar aqui, e não com `basePath` dentro
 * do app, mantém os dois ambientes com o mesmo código de rota.
 */

import { Hono } from "hono";

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

/**
 * O app é carregado dentro do handler, e não por import estático no topo.
 *
 * Import estático que falha derruba o módulo inteiro, e a Vercel responde com
 * a página de crash: `FUNCTION_INVOCATION_FAILED`, sem corpo e sem causa. Foi
 * assim que três defeitos diferentes de carregamento — formato do export,
 * CommonJS importando ESM, especificador sem extensão — apareceram todos com a
 * mesma mensagem, cada um custando um deploy para ser distinguido do anterior.
 *
 * Carregando aqui dentro, uma falha de carregamento vira resposta HTTP: dá
 * para ler qual módulo faltou em vez de deduzir. O `await` só custa no cold
 * start — depois o módulo já está em cache e a promessa resolve na hora.
 */
let carregando: Promise<Hono> | null = null;

async function montar(): Promise<Hono> {
  const { default: app } = await import("../apps/api/src/index.js");
  return new Hono().route("/api", app);
}

/**
 * O formato do export é o que decide como a Vercel chama a função.
 *
 * Um `export default` que seja uma **função** é lido como handler Node clássico
 * e recebe `(IncomingMessage, ServerResponse)`. Um `export default` que seja um
 * **objeto com `fetch`** é lido como Web Handler e recebe um `Request` padrão.
 *
 * `app.fetch` do Hono já é Web padrão, então não há adaptador no meio. O
 * wrapper passa só o `Request`: o segundo argumento do `fetch` do Hono é o
 * `env` das rotas, e entregar o contexto da plataforma ali mudaria o
 * significado de `c.env` sem necessidade.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    try {
      carregando ??= montar();
      const vercel = await carregando;
      return await vercel.fetch(request);
    } catch (erro) {
      // Uma tentativa falha não pode envenenar as seguintes: sem isto, o
      // primeiro erro ficaria em cache na promessa e toda requisição posterior
      // repetiria a mesma falha mesmo depois de corrigida.
      carregando = null;

      const e = erro as Error;
      console.error("[api] falha ao carregar o app:", e);

      return Response.json(
        {
          erro: "A função não conseguiu carregar a API.",
          causa: e?.message ?? String(erro),
          // O stack é de erro de carregamento — caminho de módulo, não dado de
          // usuário. É o que diferencia "módulo não encontrado" de "módulo
          // encontrado mas quebrou ao avaliar".
          stack: e?.stack?.split("\n").slice(0, 8),
        },
        { status: 500 },
      );
    }
  },
};
