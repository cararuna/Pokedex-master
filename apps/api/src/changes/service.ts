import { db } from "../db/client.js";
import { proporMudanca } from "./proposer.js";
import {
  parseProposal,
  diff,
  OperationError,
  type OperationDef,
  type Proposal,
  type Row,
} from "./operations.js";
import { reindexarRegras } from "../rag/reindex.js";
import type { Actor } from "../auth/tokens.js";
import {
  ROLES,
  cotaPorHora,
  podePropor,
  EXIGE_APROVADOR_DISTINTO,
} from "../auth/policy.js";

/**
 * O ciclo de vida de um pedido de mudança.
 *
 * Três coisas acontecem aqui que não são óbvias e que são a razão de este
 * arquivo existir em vez de a rota chamar a operação direto:
 *
 *   1. **Cadeado.** A transição proposed → approved é um UPDATE condicional.
 *      Duas abas clicando em Approve fazem a segunda afetar zero linhas.
 *
 *   2. **Drift.** A proposta foi montada contra um estado que pode ter mudado
 *      entre a proposta e a aprovação. Aplicar mesmo assim gravaria um
 *      "antes" que já era outro — e o inverso guardado desfaria para um valor
 *      que nunca existiu.
 *
 *   3. **Verificação.** Depois de escrever, relê e confere que mudou
 *      exatamente o que devia — nem menos, nem mais.
 */

export type ChangeStatus =
  | "proposed"
  | "approved"
  | "applied"
  | "rejected"
  | "failed"
  | "rolled_back"
  | "unsupported"
  | "denied";

export interface ChangeRequest {
  id: string;
  request_text: string;
  status: ChangeStatus;
  operation: Proposal | null;
  before_state: Row | null;
  after_state: Row | null;
  inverse_operation: Proposal | null;
  rationale: string | null;
  error: string | null;
  requested_by_token: string | null;
  requested_by: string | null;
  decided_by_token: string | null;
  decided_by: string | null;
  model: string | null;
  cost_usd: number | null;
  rollback_of: string | null;
  created_at: string;
  decided_at: string | null;
  applied_at: string | null;
}

/** Erro do fluxo, com o código HTTP que a rota deve devolver. */
export class ChangeError extends Error {
  constructor(
    readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = "ChangeError";
  }
}

async function inserir(campos: Partial<ChangeRequest>): Promise<ChangeRequest> {
  const { data, error } = await db.from("change_requests").insert(campos).select("*").single();
  if (error) throw new Error(error.message);
  return data as ChangeRequest;
}

async function atualizar(id: string, campos: Partial<ChangeRequest>): Promise<ChangeRequest> {
  const { data, error } = await db
    .from("change_requests")
    .update(campos)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as ChangeRequest;
}

/* ── Proposta ─────────────────────────────────────────────────────────────── */

/**
 * Cota por hora, contada na própria tabela de pedidos.
 *
 * Não há store de rate limit separado porque não precisa haver: toda proposta
 * já deixa uma linha datada e assinada. Contar as da última hora é uma
 * consulta indexada, e o limite sobrevive a reinício de processo — que é
 * exatamente onde um contador em memória falha numa plataforma serverless,
 * onde cada requisição pode cair numa instância nova.
 */
async function verificarCota(ator: Actor): Promise<void> {
  const teto = cotaPorHora(ator.role);
  const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error } = await db
    .from("change_requests")
    .select("id", { count: "exact", head: true })
    .eq("requested_by_token", ator.tokenId)
    .gte("created_at", desde);

  if (error) throw new Error(error.message);

  if ((count ?? 0) >= teto) {
    throw new ChangeError(
      429,
      `Rate limit: ${ator.role} may submit ${teto} requests per hour. Try again later.`,
    );
  }
}

/**
 * Texto livre → pedido persistido, pronto para aprovação.
 *
 * Nada é escrito no domínio aqui. O que sai desta função é, no máximo, uma
 * linha em `change_requests` — e é isso que permite propor sem medo.
 */
export async function criarPedido(entrada: {
  text: string;
  model?: string;
  actor: Actor;
}): Promise<ChangeRequest> {
  const { actor } = entrada;
  await verificarCota(actor);

  const permitidas = ROLES[actor.role].operationKinds;

  const autoria = {
    request_text: entrada.text,
    requested_by_token: actor.tokenId,
    requested_by: actor.label,
  };

  // Papel sem nenhuma operação liberada não chega a chamar o modelo. Gastar
  // uma requisição paga para descobrir algo que a política já sabia seria
  // pagar para ser recusado.
  if (permitidas !== null && permitidas.length === 0) {
    return inserir({
      ...autoria,
      status: "denied",
      error: `Your role (${actor.role}) cannot propose any change.`,
    });
  }

  const gerada = await proporMudanca(entrada.text, {
    model: entrada.model,
    // Privilégio mínimo no próprio menu: o modelo só enxerga o que este papel
    // poderia propor, então nem chega a formular o que seria recusado.
    kinds: permitidas,
  });

  const comum = {
    ...autoria,
    rationale: gerada.rationale,
    model: gerada.model,
    cost_usd: gerada.costUsd,
  };

  // O modelo recusou traduzir. Guardado assim mesmo: a lista do que pediram e
  // o cardápio não cobre é a fila de backlog mais honesta que existe.
  if (!gerada.proposal) {
    return inserir({
      ...comum,
      status: "unsupported",
      error: gerada.unsupportedReason,
    });
  }

  let op: OperationDef<any>;
  let args: any;
  let proposal: Proposal;

  try {
    ({ op, args, proposal } = parseProposal(gerada.proposal));
  } catch (e) {
    // Proposta malformada apesar do schema. Vira registro, não exceção: quem
    // pediu merece ver o motivo, e a linha alimenta os evals.
    return inserir({
      ...comum,
      status: "failed",
      operation: gerada.proposal,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  /**
   * Segunda camada, e não é redundância.
   *
   * O menu filtrado evita o gasto; esta checagem garante o resultado. Elas
   * cobrem falhas diferentes: o modelo pode emitir um `kind` que não estava no
   * menu — `parseProposal` aceita qualquer operação registrada, porque também
   * valida propostas relidas do banco. Sem esta linha, o filtro do menu seria
   * uma sugestão, e permissão que é sugestão não é permissão.
   */
  if (!podePropor(actor.role, proposal.kind)) {
    return inserir({
      ...comum,
      status: "denied",
      operation: proposal,
      error: `Your role (${actor.role}) cannot propose "${proposal.kind}".`,
    });
  }

  try {
    const antes = await op.read(args);
    return inserir({
      ...comum,
      status: "proposed",
      operation: proposal,
      before_state: antes,
      /**
       * Aqui `after_state` é **projeção**, não fato — é o que a tela mostra do
       * lado direito do diff. Na aplicação ele é sobrescrito pela releitura do
       * banco, que é o que de fato ficou gravado.
       */
      after_state: op.project(args, antes),
    });
  } catch (e) {
    // Operação bem formada apontando para alvo que não existe ou é ambíguo.
    // Distinto de `unsupported`: ali o modelo se recusou; aqui ele tentou e o
    // banco não tinha o alvo.
    return inserir({
      ...comum,
      status: "failed",
      operation: proposal,
      error: e instanceof OperationError ? e.message : String(e),
    });
  }
}

/* ── Aplicação ────────────────────────────────────────────────────────────── */

interface OpcoesDeAplicacao {
  /**
   * Rollback não confere drift de propósito.
   *
   * A intenção do desfazer é justamente sobrescrever o que está lá agora e
   * devolver o valor anterior. Exigir que o estado atual case com o de antes
   * faria o rollback falhar exatamente quando é mais necessário — depois de
   * alguém ter mexido de novo.
   */
  verificarDrift: boolean;
}

/**
 * Executa um pedido já travado em `approved`.
 *
 * A sequência é: revalidar → reler → conferir drift → escrever → reler →
 * conferir o que mudou → guardar o inverso → reindexar se for prosa.
 */
async function executar(
  pedido: ChangeRequest,
  opcoes: OpcoesDeAplicacao,
): Promise<ChangeRequest> {
  const falhar = (mensagem: string) =>
    atualizar(pedido.id, { status: "failed", error: mensagem });

  let op: OperationDef<any>;
  let args: any;

  try {
    /**
     * Revalidação contra o registro, mesmo vindo do nosso próprio banco.
     *
     * A linha pode ter sido gravada por uma versão anterior do cardápio — uma
     * operação removida, um campo que mudou de nome. Confiar no JSON
     * persistido é confiar num contrato que ninguém garantiu que ainda vale.
     */
    ({ op, args } = parseProposal(pedido.operation));
  } catch (e) {
    return falhar(e instanceof Error ? e.message : String(e));
  }

  let antes: Row;
  try {
    antes = await op.read(args);
  } catch (e) {
    return falhar(`Target no longer readable: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (opcoes.verificarDrift && pedido.before_state) {
    const mudouSozinho = diff(pedido.before_state, antes);
    if (mudouSozinho.length > 0) {
      return falhar(
        "The data changed after this was proposed: " +
          mudouSozinho.map((d) => `${d.field} ${d.from} → ${d.to}`).join(", ") +
          ". Submit the request again so it is proposed against the current value.",
      );
    }
  }

  const esperado = op.project(args, antes);
  const inverso = op.invert(args, antes);

  let depois: Row;
  try {
    depois = await op.apply(args);
  } catch (e) {
    return falhar(e instanceof Error ? e.message : String(e));
  }

  /**
   * O teste. Relê e compara com a projeção.
   *
   * Não é cerimônia: `apply` devolve o que o PostgREST respondeu, e o que
   * interessa é o que ficou na tabela. Comparar contra `esperado` pega os dois
   * lados — campo que devia mudar e não mudou, e campo que mudou sem ninguém
   * pedir, que é o defeito que um `update` mal escrito produz e que passa
   * despercebido para sempre.
   */
  const divergencia = diff(esperado, depois);
  if (divergencia.length > 0) {
    return falhar(
      "Applied, but the result does not match the preview: " +
        divergencia.map((d) => `${d.field} expected ${d.from}, got ${d.to}`).join("; ") +
        ". The row was written — check it before retrying.",
    );
  }

  /**
   * Reindexação do RAG, quando a operação mexeu em prosa.
   *
   * Falha aqui **não** derruba a mudança: o banco já tem o valor certo, e o
   * pedido cumpriu o que prometeu. O que se perde é o agente responder com o
   * texto novo até a próxima reindexação — então o erro fica registrado na
   * linha, visível na tela, em vez de sumir.
   */
  let avisoDeIndice: string | null = null;
  if (op.reindexesRag) {
    try {
      await reindexarRegras();
    } catch (e) {
      avisoDeIndice =
        "Applied, but the search index was not refreshed: " +
        (e instanceof Error ? e.message : String(e)) +
        ". The assistant may quote the old text until it is reindexed.";
    }
  }

  return atualizar(pedido.id, {
    status: "applied",
    applied_at: new Date().toISOString(),
    before_state: antes,
    after_state: depois,
    inverse_operation: inverso,
    error: avisoDeIndice,
  });
}

/* ── Decisões ─────────────────────────────────────────────────────────────── */

/**
 * Aprova e aplica.
 *
 * O UPDATE condicional é o cadeado: `where status = 'proposed'` faz a segunda
 * chamada concorrente não encontrar linha, e ela desiste em vez de aplicar a
 * mesma mudança duas vezes.
 */
export async function aprovar(id: string, ator: Actor): Promise<ChangeRequest> {
  /**
   * Segregação de funções, quando ligada: quem propôs não aprova.
   *
   * A checagem é feita antes do cadeado de propósito. Fazê-la depois deixaria
   * o pedido travado em `approved` por uma tentativa que nunca teve chance de
   * seguir — e um pedido travado nesse estado não volta a aparecer para
   * ninguém aprovar.
   */
  if (EXIGE_APROVADOR_DISTINTO) {
    const { data: atual } = await db
      .from("change_requests")
      .select("requested_by_token")
      .eq("id", id)
      .maybeSingle();

    if ((atual as { requested_by_token: string | null } | null)?.requested_by_token === ator.tokenId) {
      throw new ChangeError(403, "Separation of duties: you cannot approve your own request.");
    }
  }

  const { data, error } = await db
    .from("change_requests")
    .update({
      status: "approved",
      decided_at: new Date().toISOString(),
      decided_by_token: ator.tokenId,
      decided_by: ator.label,
    })
    .eq("id", id)
    .eq("status", "proposed")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    throw new ChangeError(409, "This request is not awaiting approval — it was already decided.");
  }

  return executar(data as ChangeRequest, { verificarDrift: true });
}

export async function rejeitar(id: string, ator: Actor): Promise<ChangeRequest> {
  const { data, error } = await db
    .from("change_requests")
    .update({
      status: "rejected",
      decided_at: new Date().toISOString(),
      decided_by_token: ator.tokenId,
      decided_by: ator.label,
    })
    .eq("id", id)
    .eq("status", "proposed")
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new ChangeError(409, "This request is not awaiting approval.");
  return data as ChangeRequest;
}

/**
 * Desfaz um pedido aplicado.
 *
 * Não edita nem apaga a linha original: cria uma **nova**, carregando a
 * operação inversa e apontando para ela por `rollback_of`. O histórico é
 * append-only, e é o que permite ler a mesa de trás para frente e entender
 * como o dado chegou onde chegou — inclusive quando o rollback também deu
 * errado.
 */
export async function reverter(id: string, ator: Actor): Promise<ChangeRequest> {
  const { data, error } = await db
    .from("change_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const original = data as ChangeRequest | null;

  if (!original) throw new ChangeError(404, "Request not found.");
  if (original.status !== "applied") {
    throw new ChangeError(409, `Only applied requests can be rolled back — this one is ${original.status}.`);
  }
  if (!original.inverse_operation) {
    throw new ChangeError(409, "This request has no recorded inverse.");
  }

  const desfazer = await inserir({
    request_text: `Roll back: ${original.request_text}`,
    status: "approved",
    operation: original.inverse_operation,
    rationale: "Inverse recorded when the original change was applied.",
    rollback_of: original.id,
    decided_at: new Date().toISOString(),
    // Quem pede o rollback é também quem o autoriza — não há proposta a
    // aprovar aqui, a operação já foi calculada e revisada quando a original
    // passou. Registrado nos dois campos para o histórico não ter buraco.
    requested_by_token: ator.tokenId,
    requested_by: ator.label,
    decided_by_token: ator.tokenId,
    decided_by: ator.label,
  });

  const resultado = await executar(desfazer, { verificarDrift: false });

  // A original só vira `rolled_back` se o desfazer de fato passou. Marcar
  // antes deixaria o histórico afirmando que voltou quando não voltou.
  if (resultado.status === "applied") {
    await atualizar(original.id, { status: "rolled_back" });
  }

  return resultado;
}

/* ── Apresentação ─────────────────────────────────────────────────────────── */

export interface ChangeRequestView extends ChangeRequest {
  /** A frase legível da operação, ou `null` se não há operação. */
  summary: string | null;
  /** Os campos que mudam, prontos para virar linhas de tabela na tela. */
  changes: { field: string; from: unknown; to: unknown }[];
}

/**
 * Enriquece o registro com o que a tela precisa mostrar.
 *
 * Poderia ser feito no cliente — `before_state` e `after_state` vão inteiros
 * na resposta. Mas `summary` é um método da operação e `diff` é a função que a
 * verificação pós-escrita usa; reimplementar os dois em TypeScript do
 * navegador criaria duas descrições da mesma mudança, e elas divergiriam na
 * primeira operação nova.
 *
 * Nunca lança: um pedido antigo cuja operação saiu do registro precisa
 * continuar aparecendo no histórico, sem resumo, e não derrubar a listagem.
 */
export function apresentar(pedido: ChangeRequest): ChangeRequestView {
  let summary: string | null = null;

  try {
    if (pedido.operation) {
      const { op, args } = parseProposal(pedido.operation);
      summary = op.summary(args);
    }
  } catch {
    summary = null;
  }

  return {
    ...pedido,
    summary,
    changes:
      pedido.before_state && pedido.after_state
        ? diff(pedido.before_state, pedido.after_state)
        : [],
  };
}

/* ── Leitura ──────────────────────────────────────────────────────────────── */

export async function listarPedidos(filtro: {
  status?: ChangeStatus;
  limite?: number;
}): Promise<ChangeRequest[]> {
  let q = db
    .from("change_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filtro.limite ?? 50);

  if (filtro.status) q = q.eq("status", filtro.status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as ChangeRequest[];
}
