import { describe, it, expect } from "vitest";
import {
  operations,
  operationsByKind,
  parseProposal,
  diff,
  OperationError,
  type Row,
} from "./operations.js";
import { ROLES, podePropor, validarPolitica } from "../auth/policy.js";

/**
 * Testes do registro de operações.
 *
 * Tudo aqui é puro — `read` e `apply` tocam o banco e ficam de fora. Não é
 * limitação: o que sustenta o rollback não é a escrita, é a **álgebra** entre
 * `project` e `invert`, e essa parte não precisa de banco nenhum para ser
 * provada.
 *
 * A propriedade central, escrita como propriedade e não como exemplo:
 *
 *     invert(op, antes) aplicado sobre project(op, antes)  ===  antes
 *
 * Se ela vale, desfazer devolve exatamente o estado anterior. Se ela quebra em
 * qualquer operação, o rollback daquela operação mente — e mente em silêncio,
 * porque o `status` continua dizendo `rolled_back`.
 */

/** Um estado "antes" plausível para cada operação, com os args que a mudam. */
const CASOS: {
  kind: string;
  antes: Row;
  args: Record<string, unknown>;
}[] = [
  {
    kind: "update_move_power",
    antes: { pokemon_id: 6, move_type: "fire", attack_name: "heat-wave", game_power: 9 },
    args: { pokemon_slug: "charizard", move_type: "fire", game_power: 10 },
  },
  {
    kind: "rename_move",
    antes: { pokemon_id: 6, move_type: "fire", attack_name: "heat-wave", game_power: 10 },
    args: { pokemon_slug: "charizard", move_type: "fire", attack_name: "flare-blitz" },
  },
  {
    kind: "update_talent_text",
    antes: { id: 12, type: "grass", name: "Leech Seed", description: "Texto antigo", position: 2 },
    args: { type: "grass", talent_name: "Leech Seed", description: "Texto novo" },
  },
  {
    kind: "update_ability_text",
    antes: { id: 3, key: "blaze", name: "Blaze", description: "Texto antigo" },
    args: { ability_name: "Blaze", description: "Texto novo" },
  },
];

describe("registro", () => {
  it("cobre toda operação registrada com um caso de teste", () => {
    // Sem isto, acrescentar uma quinta operação passaria por aqui sem teste
    // nenhum — e a suíte continuaria verde afirmando que está tudo coberto.
    expect(CASOS.map((c) => c.kind).sort()).toEqual(operations.map((o) => o.kind).sort());
  });

  it("não tem kind duplicado", () => {
    expect(operationsByKind.size).toBe(operations.length);
  });
});

describe("álgebra de project e invert", () => {
  for (const caso of CASOS) {
    const op = operationsByKind.get(caso.kind)!;

    it(`${caso.kind}: project muda alguma coisa`, () => {
      // Uma operação que não muda nada passaria trivialmente no teste de
      // ida e volta abaixo, sem nunca ter sido exercitada.
      const depois = op.project(caso.args, caso.antes);
      expect(diff(caso.antes, depois).length).toBeGreaterThan(0);
    });

    it(`${caso.kind}: inverter desfaz exatamente`, () => {
      const depois = op.project(caso.args, caso.antes);
      const inverso = op.invert(caso.args, caso.antes);

      // O inverso precisa ser uma operação válida do registro — não basta ser
      // um objeto qualquer que só o rollback consegue interpretar.
      const { op: opInversa, args: argsInversos } = parseProposal(inverso);

      const voltou = opInversa.project(argsInversos, depois);
      expect(voltou).toEqual(caso.antes);
    });

    it(`${caso.kind}: aplicar duas vezes é idempotente`, () => {
      // Importa porque a aprovação relê o estado atual antes de escrever: se
      // a mesma operação rodasse de novo sobre o próprio resultado, não pode
      // deslizar o valor mais uma casa.
      const uma = op.project(caso.args, caso.antes);
      const duas = op.project(caso.args, uma);
      expect(duas).toEqual(uma);
    });
  }
});

describe("parseProposal", () => {
  it("recusa kind desconhecido", () => {
    expect(() => parseProposal({ kind: "drop_table", args: {} })).toThrow(OperationError);
  });

  it("recusa formato que não é { kind, args }", () => {
    expect(() => parseProposal("update everything")).toThrow(OperationError);
    expect(() => parseProposal(null)).toThrow(OperationError);
  });

  it("recusa valor de ataque fora da escala do jogo", () => {
    // 90 é o número da série. É o erro mais provável do modelo e o que os
    // evals do agente já vigiam — aqui ele não chega nem a virar proposta.
    expect(() =>
      parseProposal({
        kind: "update_move_power",
        args: { pokemon_slug: "charizard", move_type: "fire", game_power: 90 },
      }),
    ).toThrow(/game_power/);
  });

  it("recusa argumento faltando", () => {
    expect(() =>
      parseProposal({ kind: "update_move_power", args: { pokemon_slug: "charizard" } }),
    ).toThrow(OperationError);
  });

  it("devolve os args já validados e normalizados", () => {
    const { proposal } = parseProposal({
      kind: "update_talent_text",
      args: { type: "grass", talent_name: "Leech Seed", description: "novo" },
    });
    expect(proposal.kind).toBe("update_talent_text");
    expect(proposal.args).toMatchObject({ type: "grass" });
  });
});

describe("diff", () => {
  it("ignora campo igual e aponta o que mudou", () => {
    expect(diff({ a: 1, b: "x" }, { a: 2, b: "x" })).toEqual([{ field: "a", from: 1, to: 2 }]);
  });

  it("enxerga campo que apareceu do nada", () => {
    // É o caso que a verificação pós-escrita precisa pegar: um `update` que
    // mexeu em coluna que ninguém pediu.
    expect(diff({ a: 1 }, { a: 1, extra: true })).toEqual([
      { field: "extra", from: undefined, to: true },
    ]);
  });
});

describe("política", () => {
  it("não cita operação inexistente", () => {
    expect(() => validarPolitica()).not.toThrow();
  });

  it("master propõe qualquer operação", () => {
    for (const op of operations) expect(podePropor("master", op.kind)).toBe(true);
  });

  it("editor mexe em texto, não em valor de ataque", () => {
    expect(podePropor("editor", "update_talent_text")).toBe(true);
    expect(podePropor("editor", "update_move_power")).toBe(false);
    expect(podePropor("editor", "rename_move")).toBe(false);
  });

  it("viewer não propõe nada", () => {
    for (const op of operations) expect(podePropor("viewer", op.kind)).toBe(false);
  });

  it("só o master aprova e reverte", () => {
    expect(ROLES.master.capabilities).toContain("changes:approve");
    expect(ROLES.editor.capabilities).not.toContain("changes:approve");
    expect(ROLES.editor.capabilities).not.toContain("changes:rollback");
  });
});
