/**
 * Cliente da API do catálogo.
 *
 * Substitui a leitura do `dataset.json` importado estaticamente. É o que fecha
 * a migração: o dado deixa de viajar no bundle e passa a vir do Supabase,
 * paginado.
 *
 * A URL base vem de `api-base.ts`, compartilhada com o cliente do agente.
 */

import { API_BASE as BASE } from "./api-base";

export interface ApiMove {
  attack_name: string;
  move_type: string;
  game_power: number;
}

export interface ApiPokemon {
  id: number;
  slug: string;
  dex_number: number;
  types: string[];
  sprites: Record<string, string | null>;
  /** Presente só quando a busca filtra por tipo de ataque. */
  ataque_destacado?: { nome: string; tipo: string; valor: number };
}

export interface ApiPokemonDetail extends ApiPokemon {
  ataques: ApiMove[];
  habilidades_inatas: { name: string; description: string }[];
  talentos: { type: string; name: string; description: string; position: number }[];
}

export interface Pagina<T> {
  total: number;
  pagina: number;
  itens: T[];
}

export class ApiOfflineError extends Error {
  constructor() {
    super("A API não está respondendo.");
    this.name = "ApiOfflineError";
  }
}

async function getJson<T>(caminho: string, signal?: AbortSignal): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${BASE}${caminho}`, { signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    // Falha de rede aqui é quase sempre API fora do ar. Um erro próprio deixa
    // a interface explicar o que fazer em vez de mostrar "Failed to fetch".
    throw new ApiOfflineError();
  }
  if (!r.ok) throw new Error(`A API respondeu ${r.status}`);
  return r.json() as Promise<T>;
}

export function listarPokemon(
  params: {
    busca?: string;
    tipoDeAtaque?: string;
    pagina?: number;
    porPagina?: number;
  },
  signal?: AbortSignal,
): Promise<Pagina<ApiPokemon>> {
  const q = new URLSearchParams();
  if (params.busca) q.set("busca", params.busca);
  if (params.tipoDeAtaque && params.tipoDeAtaque !== "all") {
    q.set("tipo_de_ataque", params.tipoDeAtaque);
  }
  q.set("pagina", String(params.pagina ?? 1));
  q.set("por_pagina", String(params.porPagina ?? 24));

  return getJson<Pagina<ApiPokemon>>(`/pokemon?${q}`, signal);
}

export function obterPokemon(
  slug: string,
  signal?: AbortSignal,
): Promise<ApiPokemonDetail> {
  return getJson<ApiPokemonDetail>(`/pokemon/${slug}`, signal);
}

export async function apiOnline(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}
