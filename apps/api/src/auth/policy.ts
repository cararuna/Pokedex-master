import { operationsByKind } from "../changes/operations.js";

/**
 * Política de acesso, declarada.
 *
 * Fica num arquivo só, e sem nenhum I/O, por um motivo prático: permissão
 * espalhada por `if` dentro de rota é permissão que ninguém consegue auditar.
 * Aqui a pergunta "quem pode aprovar uma mudança?" se responde lendo uma
 * tabela de trinta linhas, não varrendo o servidor.
 *
 * O modelo é o clássico RBAC — papel → capacidades — com um segundo eixo que
 * o domínio pediu: **quais operações** o papel pode propor. A distinção não é
 * decorativa. Corrigir o texto de um talento é redação; mudar o valor de um
 * ataque é balanceamento, e balanceamento quebra partida. Quem revisa texto
 * não precisa poder mexer em número.
 */

export type Role = "master" | "editor" | "viewer";

export type Capability =
  | "changes:read"
  | "changes:propose"
  | "changes:approve"
  | "changes:rollback";

export interface RoleDef {
  /** Aparece na tela e no erro de permissão. */
  description: string;
  capabilities: Capability[];
  /** `null` significa qualquer operação do registro. */
  operationKinds: string[] | null;
  /**
   * Teto de propostas por hora.
   *
   * Não é proteção contra abuso — quem tem token está na mesa. É controle de
   * custo: cada proposta é uma chamada paga ao modelo, e um laço acidental no
   * front consumiria a conta sem ninguém notar até a fatura.
   */
  proposalsPerHour: number;
}

export const ROLES: Record<Role, RoleDef> = {
  master: {
    description: "Game master — proposes, approves and rolls back anything.",
    capabilities: ["changes:read", "changes:propose", "changes:approve", "changes:rollback"],
    operationKinds: null,
    proposalsPerHour: 60,
  },

  editor: {
    description: "Editor — proposes wording fixes; cannot approve or change values.",
    capabilities: ["changes:read", "changes:propose"],
    // Só prosa. Valor de ataque é balanceamento, e balanceamento é do mestre.
    operationKinds: ["update_talent_text", "update_ability_text"],
    proposalsPerHour: 20,
  },

  viewer: {
    description: "Viewer — reads the history, changes nothing.",
    capabilities: ["changes:read"],
    operationKinds: [],
    proposalsPerHour: 0,
  },
};

/**
 * Exigir que quem aprova não seja quem propôs.
 *
 * Desligado por padrão, e é uma escolha, não um esquecimento: numa mesa com um
 * mestre só, ligar isto trava toda proposta dele — não há segunda pessoa com
 * `changes:approve`. Vale ligar quando existir mais de um `master`.
 */
export const EXIGE_APROVADOR_DISTINTO = false;

export function temCapacidade(role: Role, capacidade: Capability): boolean {
  return ROLES[role].capabilities.includes(capacidade);
}

/** Se o papel pode propor esta operação específica. */
export function podePropor(role: Role, kind: string): boolean {
  if (!temCapacidade(role, "changes:propose")) return false;
  const permitidas = ROLES[role].operationKinds;
  return permitidas === null || permitidas.includes(kind);
}

export function cotaPorHora(role: Role): number {
  return ROLES[role].proposalsPerHour;
}

/**
 * Confere que a política não cita operação inexistente.
 *
 * Um `kind` com erro de digitação aqui não daria erro nenhum: ele
 * simplesmente nunca casaria, e o papel perderia a permissão em silêncio.
 * Falhar na partida transforma um bug mudo num erro que aparece no primeiro
 * `pnpm dev`.
 */
export function validarPolitica(): void {
  const desconhecidas = Object.entries(ROLES).flatMap(([role, def]) =>
    (def.operationKinds ?? []).filter((k) => !operationsByKind.has(k)).map((k) => `${role}: ${k}`),
  );

  if (desconhecidas.length > 0) {
    throw new Error(
      `Política cita operações que não existem no registro: ${desconhecidas.join(", ")}`,
    );
  }
}
