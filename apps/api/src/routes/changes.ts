import { Hono } from "hono";
import { z } from "zod";
import {
  criarPedido,
  listarPedidos,
  aprovar,
  rejeitar,
  reverter,
  apresentar,
  ChangeError,
  type ChangeStatus,
} from "../changes/service.js";
import { operations, OperationError } from "../changes/operations.js";
import { exigir, atorDe, type ComAtor } from "../auth/middleware.js";
import { ROLES } from "../auth/policy.js";

/**
 * Rotas do inbox de mudanças.
 *
 * Toda rota aqui exige token — inclusive as de leitura. Não é excesso: a
 * listagem mostra o que cada pessoa pediu e quem aprovou o quê, que é
 * informação sobre gente, não sobre o jogo. As rotas de catálogo continuam
 * abertas porque catálogo é público por natureza.
 *
 * A capacidade exigida fica na declaração da rota, não dentro do handler. É o
 * que permite ler o arquivo e saber quem entra onde sem seguir o fluxo de
 * execução até um `if` no meio de uma função.
 */

const changes = new Hono<ComAtor>();

/* ── Tradução de erro ─────────────────────────────────────────────────────── */

/**
 * `ChangeError` e `OperationError` são falhas esperadas — cota estourada,
 * alvo inexistente, pedido já decidido. Sem esta tradução todas virariam 500,
 * e a tela não teria como distinguir "corrija o texto" de "tente de novo".
 *
 * O 422 do `OperationError` é deliberado: a requisição está bem formada (não é
 * 400), mas o que ela pede não existe no banco.
 */
changes.onError((err, c) => {
  if (err instanceof ChangeError) {
    return c.json({ erro: err.message }, err.httpStatus as 400);
  }
  if (err instanceof OperationError) {
    return c.json({ erro: err.message, codigo: err.code }, 422);
  }
  console.error("[changes] erro não tratado:", err);
  return c.json({ erro: err.message || "Erro interno" }, 500);
});

/* ── Identidade ───────────────────────────────────────────────────────────── */

/**
 * Quem sou eu e o que posso fazer.
 *
 * Existe para a interface, e resolve um problema concreto: sem isto o front
 * teria de esconder botões por adivinhação, ou mostrar tudo e deixar o 403
 * aparecer como erro depois do clique. Aqui ele pergunta uma vez e monta a
 * tela certa.
 *
 * Não é controle de acesso — o servidor continua checando cada rota. É só o
 * que a tela precisa saber para não prometer o que não pode cumprir.
 */
changes.get("/me", exigir("changes:read"), (c) => {
  const ator = atorDe(c);
  const papel = ROLES[ator.role];
  return c.json({
    label: ator.label,
    role: ator.role,
    description: papel.description,
    capabilities: papel.capabilities,
    operationKinds: papel.operationKinds ?? operations.map((o) => o.kind),
    proposalsPerHour: papel.proposalsPerHour,
  });
});

/** O cardápio, para a tela explicar o que dá para pedir. */
changes.get("/operations", exigir("changes:read"), (c) =>
  c.json(operations.map((o) => ({ kind: o.kind, description: o.description }))),
);

/* ── Fila ─────────────────────────────────────────────────────────────────── */

const filtroSchema = z.object({
  status: z
    .enum([
      "proposed",
      "approved",
      "applied",
      "rejected",
      "failed",
      "rolled_back",
      "unsupported",
      "denied",
    ])
    .optional(),
  limite: z.coerce.number().min(1).max(200).default(50),
});

changes.get("/", exigir("changes:read"), async (c) => {
  const filtro = filtroSchema.safeParse(c.req.query());
  if (!filtro.success) {
    return c.json({ erro: "Parâmetros inválidos", detalhes: filtro.error.issues }, 400);
  }

  const pedidos = await listarPedidos({
    status: filtro.data.status as ChangeStatus | undefined,
    limite: filtro.data.limite,
  });

  return c.json(pedidos.map(apresentar));
});

const propostaSchema = z.object({
  text: z.string().min(3).max(500),
  /** Override de modelo, mesmo formato do agente — usado pelos evals. */
  model: z
    .string()
    .regex(/^[a-z0-9-]+\/[a-z0-9.:-]+$/i, "ID de modelo inválido")
    .optional(),
});

changes.post("/", exigir("changes:propose"), async (c) => {
  const body = propostaSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!body.success) {
    return c.json({ erro: "Pedido inválido", detalhes: body.error.issues }, 400);
  }

  const pedido = await criarPedido({
    text: body.data.text,
    model: body.data.model,
    actor: atorDe(c),
  });

  // 201 só quando nasceu algo para decidir. Recusa e falha de proposta são
  // respostas legítimas da rota — o pedido foi registrado — mas devolver 201
  // faria a tela comemorar uma proposta que ninguém vai aprovar.
  return c.json(apresentar(pedido), pedido.status === "proposed" ? 201 : 200);
});

/* ── Decisões ─────────────────────────────────────────────────────────────── */

changes.post("/:id/approve", exigir("changes:approve"), async (c) =>
  c.json(apresentar(await aprovar(c.req.param("id"), atorDe(c)))),
);

changes.post("/:id/reject", exigir("changes:approve"), async (c) =>
  c.json(apresentar(await rejeitar(c.req.param("id"), atorDe(c)))),
);

changes.post("/:id/rollback", exigir("changes:rollback"), async (c) =>
  c.json(apresentar(await reverter(c.req.param("id"), atorDe(c)))),
);

export default changes;
