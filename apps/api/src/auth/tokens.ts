import { createHash, randomBytes } from "node:crypto";
import { db } from "../db/client.js";
import type { Role } from "./policy.js";

/**
 * Tokens de acesso: emissão e resolução.
 *
 * **O banco nunca vê o token.** Guardamos o SHA-256; o valor em claro existe
 * uma vez, na saída do script que o emite, e depois só na mão de quem recebeu.
 * Um dump vazado dá ao atacante uma lista de hashes, com a qual ele não se
 * autentica.
 *
 * Detalhe que costuma ser feito errado: aqui **não há comparação de segredo**.
 * O caminho é hash → consulta por índice, não consulta → compara. Isso remove
 * a necessidade de `timingSafeEqual` em vez de fingir que ela foi resolvida —
 * o que vaza por tempo é só "existe ou não existe", que qualquer resposta 401
 * já entrega de qualquer forma.
 *
 * Não há cache de token, e é escolha. Com seis pessoas, a consulta extra é
 * irrelevante; e um cache de sessenta segundos significaria que revogar o
 * acesso de alguém demora sessenta segundos para valer. Revogação lenta é pior
 * que consulta rápida.
 */

/** Quem está falando com a API. */
export interface Actor {
  tokenId: string;
  label: string;
  role: Role;
}

const PREFIXO = "pkdx_";

/**
 * 32 bytes de entropia — o mesmo patamar de um token de API de plataforma.
 *
 * `base64url` e não `hex` porque hex gasta o dobro de caracteres para a mesma
 * entropia, e este token vai ser copiado e colado à mão.
 */
export function gerarToken(): { plain: string; hash: string } {
  const plain = PREFIXO + randomBytes(32).toString("base64url");
  return { plain, hash: hashDoToken(plain) };
}

export function hashDoToken(plain: string): string {
  return createHash("sha256").update(plain.trim()).digest("hex");
}

/** Extrai o token de `Authorization: Bearer …` ou do header próprio. */
export function tokenDoRequest(headers: {
  get(nome: string): string | null | undefined;
}): string | null {
  const auth = headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();

  const proprio = headers.get("x-admin-token");
  return proprio?.trim() || null;
}

interface LinhaDeToken {
  id: string;
  label: string;
  role: Role;
  revoked_at: string | null;
  last_used_at: string | null;
}

/** Token em claro → ator, ou `null` se não existe ou foi revogado. */
export async function resolverAtor(plain: string | null): Promise<Actor | null> {
  if (!plain || !plain.startsWith(PREFIXO)) return null;

  const { data, error } = await db
    .from("api_tokens")
    .select("id, label, role, revoked_at, last_used_at")
    .eq("token_hash", hashDoToken(plain))
    .maybeSingle();

  if (error) throw new Error(error.message);

  const linha = data as LinhaDeToken | null;
  if (!linha || linha.revoked_at) return null;

  void registrarUso(linha);

  return { tokenId: linha.id, label: linha.label, role: linha.role };
}

/**
 * `last_used_at`, com folga de cinco minutos.
 *
 * Serve para responder "este token ainda é usado?" na hora de fazer faxina —
 * não para auditoria, que é o que `change_requests.decided_by` faz. Precisão
 * de minuto basta, e gravar a cada requisição transformaria toda leitura numa
 * escrita.
 *
 * Sem `await`: uma falha aqui não pode derrubar uma requisição autenticada.
 */
async function registrarUso(linha: LinhaDeToken): Promise<void> {
  const cincoMinutos = 5 * 60 * 1000;
  const ultimo = linha.last_used_at ? Date.parse(linha.last_used_at) : 0;
  if (Date.now() - ultimo < cincoMinutos) return;

  try {
    await db
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", linha.id);
  } catch {
    /* rastro de uso não vale uma requisição derrubada */
  }
}

/* ── Administração ────────────────────────────────────────────────────────── */

export async function criarToken(entrada: {
  label: string;
  role: Role;
}): Promise<{ id: string; plain: string }> {
  const { plain, hash } = gerarToken();

  const { data, error } = await db
    .from("api_tokens")
    .insert({ label: entrada.label, role: entrada.role, token_hash: hash })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: (data as { id: string }).id, plain };
}

export async function revogarToken(id: string): Promise<boolean> {
  const { data, error } = await db
    .from("api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function listarTokens() {
  const { data, error } = await db
    .from("api_tokens")
    // Sem `token_hash` no select: não há razão para o hash sair desta função,
    // e um `select *` distraído o colocaria numa resposta HTTP algum dia.
    .select("id, label, role, created_at, revoked_at, last_used_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
