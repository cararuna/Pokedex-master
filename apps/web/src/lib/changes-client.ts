import { API_BASE } from "./api-base";

/**
 * Cliente do inbox de mudanças.
 *
 * Diferente dos outros dois clientes deste diretório em um ponto: toda rota
 * aqui exige credencial. O token fica em `localStorage` e vai no header
 * `Authorization` a cada chamada.
 *
 * **Por que localStorage e não cookie httpOnly.** O cookie seria mais seguro
 * contra XSS, e seria a escolha certa se houvesse login. Não há: o token é
 * emitido por linha de comando e colado à mão por uma das seis pessoas da
 * mesa. Guardar em cookie exigiria uma rota de sessão que trocasse o token por
 * um cookie — uma cerimônia de autenticação inteira para um fluxo que não tem
 * senha, não tem cadastro e não tem recuperação. O risco real aqui é perder o
 * papel de vista, não roubo de sessão.
 *
 * O que **não** muda por causa disso: o servidor continua validando papel e
 * capacidade em toda rota. Nada nesta camada é controle de acesso — é só o que
 * a tela precisa para não prometer o que não pode cumprir.
 */

const CHAVE = "pokedex.change-token";

export function tokenSalvo(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    // Navegação privada em alguns navegadores lança em vez de devolver null.
    return null;
  }
}

export function salvarToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(CHAVE, token);
    else localStorage.removeItem(CHAVE);
  } catch {
    /* sem persistência, a sessão dura o que durar a aba */
  }
}

/* ── Tipos da resposta ────────────────────────────────────────────────────── */

export type ChangeStatus =
  | "proposed"
  | "approved"
  | "applied"
  | "rejected"
  | "failed"
  | "rolled_back"
  | "unsupported"
  | "denied"
  | "needs_clarification";

export type Capability =
  | "changes:read"
  | "changes:propose"
  | "changes:approve"
  | "changes:rollback";

export interface Me {
  label: string;
  role: "master" | "editor" | "viewer";
  description: string;
  capabilities: Capability[];
  operationKinds: string[];
  proposalsPerHour: number;
}

export interface Mudanca {
  field: string;
  from: unknown;
  to: unknown;
}

/**
 * Uma opção, quando mais de um alvo servia.
 *
 * `operation` já vem completa do servidor: escolher é um clique e não chama o
 * modelo. Ver `montarCandidatos` em changes/proposer.ts.
 */
export interface Candidato {
  label: string;
  detail: string;
  operation: { kind: string; args: Record<string, unknown> };
}

export interface ChangeRequest {
  id: string;
  request_text: string;
  status: ChangeStatus;
  operation: { kind: string; args: Record<string, unknown> } | null;
  candidates: Candidato[] | null;
  question: string | null;
  clarification: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  rationale: string | null;
  error: string | null;
  requested_by: string | null;
  decided_by: string | null;
  model: string | null;
  cost_usd: number | null;
  rollback_of: string | null;
  created_at: string;
  applied_at: string | null;
  /** Vem pronto do servidor — ver `apresentar` em changes/service.ts. */
  summary: string | null;
  changes: Mudanca[];
}

/* ── Erros ────────────────────────────────────────────────────────────────── */

/**
 * Token ausente, inválido ou revogado.
 *
 * Separado dos demais porque a tela reage diferente: pede a credencial de
 * novo, em vez de mostrar uma mensagem de erro. Tratar 401 como erro genérico
 * deixaria quem teve o token revogado olhando para "erro 401" sem saber que
 * bastava colar outro.
 */
export class NaoAutenticado extends Error {
  constructor() {
    super("Access token missing, invalid or revoked.");
    this.name = "NaoAutenticado";
  }
}

export class ErroDaApi extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroDaApi";
  }
}

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  const token = tokenSalvo();
  if (!token) throw new NaoAutenticado();

  let resposta: Response;
  try {
    resposta = await fetch(`${API_BASE}/changes${caminho}`, {
      ...init,
      headers: {
        ...init?.headers,
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new ErroDaApi(0, "The API is not responding.");
  }

  if (resposta.status === 401) {
    // O token guardado não vale mais. Apagar aqui evita o laço de a tela
    // tentar de novo com a mesma credencial a cada recarga.
    salvarToken(null);
    throw new NaoAutenticado();
  }

  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new ErroDaApi(
      resposta.status,
      (corpo as { erro?: string })?.erro ?? `The API responded ${resposta.status}.`,
    );
  }

  return corpo as T;
}

/* ── Operações ────────────────────────────────────────────────────────────── */

/**
 * Os caminhos da raiz são `""`, não `"/"`.
 *
 * Custou um 404 em teste: `${API_BASE}/changes` + `"/"` produz `/changes/`, e o
 * Hono não trata barra final como equivalente — a sub-app montada em
 * `/changes` responde em `/changes`, e `/changes/` é outra rota, que não
 * existe. `/changes/me` funcionava, então dava para entrar na tela e só depois
 * descobrir que listar e propor não funcionavam.
 */
export const quemSouEu = () => pedir<Me>("/me");

export const listarMudancas = () => pedir<ChangeRequest[]>("?limite=50");

export const proporMudanca = (text: string) =>
  pedir<ChangeRequest>("", { method: "POST", body: JSON.stringify({ text }) });

export const aprovar = (id: string) =>
  pedir<ChangeRequest>(`/${id}/approve`, { method: "POST" });

export const rejeitar = (id: string) =>
  pedir<ChangeRequest>(`/${id}/reject`, { method: "POST" });

export const reverter = (id: string) =>
  pedir<ChangeRequest>(`/${id}/rollback`, { method: "POST" });

export const escolher = (id: string, index: number) =>
  pedir<ChangeRequest>(`/${id}/choose`, {
    method: "POST",
    body: JSON.stringify({ index }),
  });

export const esclarecer = (id: string, text: string) =>
  pedir<ChangeRequest>(`/${id}/clarify`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

/** Valida um token colado, sem gravá-lo antes de saber se presta. */
export async function verificarToken(token: string): Promise<Me> {
  const anterior = tokenSalvo();
  salvarToken(token);
  try {
    return await quemSouEu();
  } catch (e) {
    salvarToken(anterior);
    throw e;
  }
}
