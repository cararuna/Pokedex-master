import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { serverEnv } from "./env";
import { db } from "./db/client";

/**
 * O agente é carregado sob demanda.
 *
 * `import` estático faria o cliente do OpenRouter ser construído na partida —
 * e a API inteira deixaria de subir sem a chave, inclusive as rotas de
 * catálogo, que não usam LLM nenhuma. Com o import dinâmico, o servidor sobe
 * e serve o catálogo normalmente; só as rotas do agente falham, e com uma
 * mensagem que diz o que está faltando.
 */
async function carregarAgente() {
  const [{ runAgent }, { llmEnv }] = await Promise.all([
    import("./agent/harness"),
    import("./env"),
  ]);
  return { runAgent, modelo: llmEnv().OPENROUTER_MODEL };
}

/** Configurado é diferente de funcionando — aqui só checamos a presença. */
const agenteConfigurado = () =>
  Boolean(process.env.OPENROUTER_API_KEY?.startsWith("sk-or-"));

/**
 * API do companion.
 *
 * Hono e não Express: TypeScript de primeira classe, SSE nativo e roda tanto
 * em Node quanto em runtime serverless — o mesmo código sobe no Vercel sem
 * adaptador.
 *
 * O frontend nunca fala com o Supabase direto. Fala aqui, e esta camada decide
 * o que expor. Assim as regras de acesso ficam num lugar só, em código
 * revisável, em vez de espalhadas entre policies e chamadas do cliente — e a
 * service_role nunca chega perto do navegador.
 */
const app = new Hono();

/**
 * CORS só importa em desenvolvimento, onde o front (:3000) e a API (:8787)
 * são origens diferentes. Publicados, os dois vivem no mesmo domínio da
 * Vercel e o navegador nem envia preflight.
 *
 * `WEB_ORIGIN` continua explícito em vez de `*`: liberar qualquer origem numa
 * API que fala com o banco é abrir para qualquer site chamar em nome de quem
 * estiver navegando.
 */
app.use(
  "*",
  cors({
    origin: serverEnv.WEB_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    catalogo: true,
    agente: agenteConfigurado(),
    model: agenteConfigurado() ? process.env.OPENROUTER_MODEL : null,
  }),
);

/* ── Catálogo ─────────────────────────────────────────────────────────────── */

/**
 * Lista de Pokémon com os golpes já convertidos.
 *
 * Uma requisição paginada substitui as ~15.000 que o frontend fazia à PokeAPI
 * a cada abertura. O filtro `tipo_de_ataque` é a consulta central do produto:
 * quem aprende ataque daquele tipo.
 */
app.get("/pokemon", async (c) => {
  const query = z
    .object({
      busca: z.string().optional(),
      tipo_de_ataque: z.string().optional(),
      pagina: z.coerce.number().min(1).default(1),
      por_pagina: z.coerce.number().min(1).max(100).default(24),
    })
    .safeParse(c.req.query());

  if (!query.success) {
    return c.json({ erro: "Parâmetros inválidos", detalhes: query.error.issues }, 400);
  }

  const { busca, tipo_de_ataque, pagina, por_pagina } = query.data;
  const de = (pagina - 1) * por_pagina;

  // Com filtro de tipo de ataque, a consulta parte de pokemon_moves para
  // aproveitar o índice (move_type, game_power desc) e já sair ordenada pelo
  // valor — que é a pergunta real: "quem bate mais forte nesse tipo?"
  if (tipo_de_ataque) {
    let q = db
      .from("pokemon_moves")
      .select(
        "attack_name, game_power, move_type, pokemon!inner(id, slug, dex_number, types, sprites)",
        { count: "exact" },
      )
      .eq("move_type", tipo_de_ataque)
      .order("game_power", { ascending: false })
      .range(de, de + por_pagina - 1);

    if (busca) q = q.ilike("pokemon.slug", `%${busca}%`);

    const { data, error, count } = await q;
    if (error) return c.json({ erro: error.message }, 500);

    // Com filtro por tipo, a consulta parte de pokemon_moves — então os demais
    // golpes de cada Pokémon precisam de uma segunda busca. Uma só, com IN,
    // e não uma por Pokémon.
    const ids = [...new Set((data ?? []).map((r: any) => r.pokemon.id))];
    const golpesPorPokemon = new Map<number, any[]>();

    if (ids.length) {
      const { data: todos } = await db
        .from("pokemon_moves")
        .select("pokemon_id, attack_name, move_type, game_power")
        .in("pokemon_id", ids);

      for (const g of todos ?? []) {
        const lista = golpesPorPokemon.get(g.pokemon_id) ?? [];
        lista.push(g);
        golpesPorPokemon.set(g.pokemon_id, lista);
      }
    }

    return c.json({
      total: count ?? 0,
      pagina,
      itens: (data ?? []).map((r: any) => ({
        ...r.pokemon,
        pokemon_moves: (golpesPorPokemon.get(r.pokemon.id) ?? []).sort(
          (a, b) => b.game_power - a.game_power,
        ),
        ataque_destacado: {
          nome: r.attack_name,
          tipo: r.move_type,
          valor: r.game_power,
        },
      })),
    });
  }

  // Os golpes vêm junto, por join. A frente da carta mostra todos eles — sem
  // isso o front faria 24 requisições de detalhe por página, que é exatamente
  // o padrão que esta migração veio eliminar.
  let q = db
    .from("pokemon")
    .select("id, slug, dex_number, types, sprites, pokemon_moves(attack_name, move_type, game_power)", {
      count: "exact",
    })
    .order("dex_number")
    .range(de, de + por_pagina - 1);

  if (busca) q = q.ilike("slug", `%${busca}%`);

  const { data, error, count } = await q;
  if (error) return c.json({ erro: error.message }, 500);

  return c.json({
    total: count ?? 0,
    pagina,
    itens: (data ?? []).map((p: any) => ({
      ...p,
      // Ordenado aqui e não no banco: o PostgREST não ordena tabela aninhada,
      // e a carta lista do mais forte para o mais fraco.
      pokemon_moves: [...(p.pokemon_moves ?? [])].sort(
        (a, b) => b.game_power - a.game_power,
      ),
    })),
  });
});

/** Ficha completa: golpes, habilidades inatas e talentos dos seus tipos. */
app.get("/pokemon/:slug", async (c) => {
  const slug = c.req.param("slug").toLowerCase();

  const { data: p, error } = await db
    .from("pokemon")
    .select("id, slug, dex_number, types, sprites")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return c.json({ erro: error.message }, 500);
  if (!p) return c.json({ erro: "Pokémon não encontrado" }, 404);

  const [golpes, habilidades, talentos] = await Promise.all([
    db
      .from("pokemon_moves")
      .select("attack_name, move_type, game_power")
      .eq("pokemon_id", p.id)
      .order("game_power", { ascending: false }),
    db
      .from("pokemon_abilities")
      .select("position, abilities(name, description)")
      .eq("pokemon_slug", p.slug)
      .order("position"),
    db
      .from("type_talents")
      .select("type, name, description, position")
      .in("type", p.types)
      .order("position"),
  ]);

  return c.json({
    ...p,
    ataques: golpes.data ?? [],
    habilidades_inatas: (habilidades.data ?? []).map((h: any) => h.abilities),
    talentos: talentos.data ?? [],
  });
});

app.get("/vantagens", async (c) => {
  const { data, error } = await db.from("type_advantages").select("*");
  if (error) return c.json({ erro: error.message }, 500);

  const mapa: Record<string, string[]> = {};
  for (const r of data ?? []) {
    (mapa[r.attacking_type] ??= []).push(r.defending_type);
  }
  return c.json(mapa);
});

/* ── Agente ───────────────────────────────────────────────────────────────── */

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
  /**
   * Override de modelo, usado pelos evals para comparar custo x qualidade.
   *
   * Restrito ao formato "fornecedor/modelo" do OpenRouter: sem isso, o corpo
   * da requisição vira um campo livre e qualquer cliente poderia apontar a
   * conta para o modelo mais caro do catálogo.
   */
  model: z
    .string()
    .regex(/^[a-z0-9-]+\/[a-z0-9.:-]+$/i, "ID de modelo inválido")
    .optional(),
});

/**
 * Conversa com streaming.
 *
 * SSE e não WebSocket: o fluxo é de mão única (servidor → cliente), e SSE
 * reconecta sozinho, passa por qualquer proxy HTTP e não exige protocolo
 * novo. WebSocket aqui seria complexidade sem contrapartida.
 *
 * Os eventos de ferramenta são enviados ao cliente de propósito: a interface
 * mostra "consultando ataques de fogo…" enquanto o modelo trabalha. Sem isso,
 * o agente fica mudo por vários segundos e parece travado.
 */
app.post("/agent/chat", async (c) => {
  const body = chatSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ erro: "Mensagem inválida", detalhes: body.error.issues }, 400);
  }

  if (!agenteConfigurado()) {
    return c.json(
      { erro: "Agente não configurado: falta OPENROUTER_API_KEY em apps/api/.env" },
      503,
    );
  }

  const { runAgent } = await carregarAgente();

  return streamSSE(c, async (stream) => {
    await runAgent({
      message: body.data.message,
      sessionId: body.data.sessionId,
      model: body.data.model,
      onEvent: (event) => {
        void stream.writeSSE({
          event: event.type,
          data: JSON.stringify(event),
        });
      },
    });
  });
});

/** Versão sem streaming — é o alvo do promptfoo na Fase 6. */
app.post("/agent/ask", async (c) => {
  const body = chatSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ erro: "Mensagem inválida" }, 400);
  }

  if (!agenteConfigurado()) {
    return c.json(
      { erro: "Agente não configurado: falta OPENROUTER_API_KEY em apps/api/.env" },
      503,
    );
  }

  const { runAgent } = await carregarAgente();

  const resultado = await runAgent({
    message: body.data.message,
    sessionId: body.data.sessionId,
    model: body.data.model,
  });

  return c.json(resultado);
});

/**
 * Só sobe um servidor HTTP quando executado diretamente.
 *
 * Na Vercel este módulo é importado por `api/[[...route]].ts`, que entrega o
 * `fetch` do app para o runtime serverless. Chamar `serve()` ali tentaria
 * abrir uma porta dentro de uma função — que não tem porta, e falharia no
 * cold start.
 *
 * `VERCEL` é definida pela própria plataforma no build e no runtime.
 */
if (!process.env.VERCEL) {
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
}

export default app;
