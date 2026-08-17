import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Disclosure,
  Inline,
  Stack,
  Table,
  Textarea,
} from "@pokedex/design-system";
import type {
  Candidato,
  ChangeRequest,
  ChangeStatus,
  Me,
  Mudanca,
} from "../../lib/changes-client";

/**
 * Um pedido de mudança.
 *
 * A tela nasceu mostrando tudo de todos os pedidos ao mesmo tempo — título,
 * autor, tabela de diff, raciocínio do modelo, erro — e ficou ilegível: cinco
 * blocos por item, e nada se distinguindo de nada.
 *
 * Agora a regra é a atenção que o item merece:
 *
 *   espera decisão    carta aberta, tudo à vista — é aqui que se decide
 *   histórico         uma linha; abre no clique de quem quiser conferir
 *
 * Quando um pedido pede decisão, esconder o diff seria esconder justamente o
 * que se aprova. Quando ele já foi decidido, o diff é consulta — e consulta
 * que ninguém pediu é ruído.
 */

const STATUS: Record<
  ChangeStatus,
  { rotulo: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" | "info" }
> = {
  proposed: { rotulo: "Awaiting approval", tone: "accent" },
  needs_clarification: { rotulo: "Needs your answer", tone: "info" },
  approved: { rotulo: "Applying", tone: "info" },
  applied: { rotulo: "Applied", tone: "success" },
  rejected: { rotulo: "Rejected", tone: "neutral" },
  failed: { rotulo: "Failed", tone: "danger" },
  rolled_back: { rotulo: "Rolled back", tone: "warning" },
  unsupported: { rotulo: "Not supported", tone: "neutral" },
  denied: { rotulo: "Not allowed", tone: "warning" },
};

/**
 * `undefined` vira "—" e não "undefined": o diff mostra campo que apareceu ou
 * sumiu, e nesses casos um dos lados não existe.
 */
function valor(v: unknown): string {
  if (v === null || v === undefined) return "—";
  return typeof v === "string" ? v : JSON.stringify(v);
}

function Diff({ mudancas }: { mudancas: Mudanca[] }) {
  if (mudancas.length === 0) return null;

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>Field</Table.Head>
          <Table.Head>Before</Table.Head>
          <Table.Head>After</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {mudancas.map((m) => (
          <Table.Row key={m.field}>
            <Table.Cell className="font-mono text-xs text-text-muted">{m.field}</Table.Cell>
            <Table.Cell className="text-text-muted line-through decoration-1">
              {valor(m.from)}
            </Table.Cell>
            <Table.Cell className="font-medium">{valor(m.to)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

/** A linha de procedência: quem pediu, quem decidiu, quem desfez. */
function Procedencia({
  pedido,
  revertidoPor,
}: {
  pedido: ChangeRequest;
  revertidoPor?: string | null;
}) {
  return (
    <p className="truncate text-xs text-text-subtle">
      “{pedido.request_text}” · {pedido.requested_by ?? "unknown"}
      {pedido.decided_by && pedido.decided_by !== pedido.requested_by
        ? ` · decided by ${pedido.decided_by}`
        : ""}
      {revertidoPor ? ` · undone by ${revertidoPor}` : ""}
    </p>
  );
}

/* ── Desambiguação ────────────────────────────────────────────────────────── */

/**
 * As opções, quando mais de um alvo servia.
 *
 * Botão como caminho principal, texto como saída de emergência — e a ordem
 * não é estética. Clicar é inequívoco, instantâneo e **não chama o modelo**: a
 * operação de cada candidato já foi montada. Escrever de novo paga outra
 * chamada e reabre a chance de ambiguidade. O caminho barato e certo fica
 * primeiro; o caro e incerto fica disponível.
 */
function Opcoes({
  pedido,
  ocupado,
  onEscolher,
  onEsclarecer,
}: {
  pedido: ChangeRequest;
  ocupado: boolean;
  onEscolher: (id: string, indice: number) => void;
  onEsclarecer: (id: string, texto: string) => void;
}) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);

  return (
    <Stack gap={3}>
      <p className="text-sm text-text">{pedido.question}</p>

      <Stack gap={2}>
        {(pedido.candidates ?? []).map((c: Candidato, i) => (
          <button
            key={c.label}
            type="button"
            disabled={ocupado}
            onClick={() => onEscolher(pedido.id, i)}
            className={[
              "rounded-[var(--r-sm)] border border-border bg-surface-sunken px-3 py-2 text-left",
              "transition-colors duration-[130ms] ease-out",
              "hover:border-border-interactive hover:bg-surface-hover",
              "focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            <span className="block text-sm font-medium">{c.label}</span>
            <span className="block text-xs text-text-muted">{c.detail}</span>
          </button>
        ))}
      </Stack>

      {aberto ? (
        <Stack gap={2}>
          <Textarea
            label="Add detail"
            hideLabel
            rows={2}
            maxLength={300}
            placeholder="None of these — I meant…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <Inline gap={2}>
            <Button
              size="sm"
              disabled={ocupado || texto.trim().length < 2}
              onClick={() => onEsclarecer(pedido.id, texto.trim())}
            >
              Send
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAberto(false)}>
              Cancel
            </Button>
          </Inline>
        </Stack>
      ) : (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="self-start text-xs text-text-subtle underline underline-offset-2 hover:text-text"
        >
          None of these
        </button>
      )}
    </Stack>
  );
}

/* ── Carta ────────────────────────────────────────────────────────────────── */

export interface ChangeCardProps {
  pedido: ChangeRequest;
  eu: Me;
  /**
   * Quem desfez este pedido.
   *
   * Chega de fora porque quem desfez é **outra linha** de `change_requests` —
   * o rollback é append-only no banco, e é assim que tem de ser. Na tela ele
   * não é outra mudança, é um evento nesta; a página dobra os dois antes de
   * renderizar. Ver `ChangesPage`.
   */
  revertidoPor?: string | null;
  ocupado: boolean;
  onAprovar: (id: string) => void;
  onRejeitar: (id: string) => void;
  onReverter: (id: string) => void;
  onEscolher: (id: string, indice: number) => void;
  onEsclarecer: (id: string, texto: string) => void;
}

export function ChangeCard(props: ChangeCardProps) {
  const { pedido, eu, revertidoPor, ocupado } = props;
  const estado = STATUS[pedido.status];

  const podeDecidir = pedido.status === "proposed" && eu.capabilities.includes("changes:approve");
  const podeReverter = pedido.status === "applied" && eu.capabilities.includes("changes:rollback");
  const emDuvida = pedido.status === "needs_clarification";

  const titulo = (
    <p className="truncate text-sm font-semibold">{pedido.summary ?? pedido.request_text}</p>
  );

  const selo = (
    <Badge tone={estado.tone} dot>
      {estado.rotulo}
    </Badge>
  );

  /** O miolo — diff, raciocínio, erro. Igual aberto ou expandido. */
  const detalhe = (
    <Stack gap={3}>
      <Diff mudancas={pedido.changes} />


      {pedido.rationale && (
        <p className="text-xs leading-relaxed text-text-muted">{pedido.rationale}</p>
      )}

      {pedido.clarification && (
        <p className="text-xs leading-relaxed text-text-muted">
          Clarified: “{pedido.clarification}”
        </p>
      )}

      {pedido.error && (
        <p
          className={
            // Erro num pedido aplicado não é falha: é o aviso de que o índice
            // de busca não foi atualizado. Mesma coluna, gravidade diferente.
            pedido.status === "applied"
              ? "text-xs leading-relaxed text-warning-text"
              : "text-xs leading-relaxed text-danger-text"
          }
        >
          {pedido.error}
        </p>
      )}

      {/*
        Reverter mora **dentro** do detalhe, e isso é escolha.

        Colocá-lo no resumo obrigaria a carta aplicada a ficar aberta para o
        botão caber — e como quase todo histórico é de aplicados, o histórico
        voltaria a ser o paredão que esta tela veio desfazer.

        E é o comportamento certo: desfazer sem olhar o que se desfaz é o tipo
        de clique que gera o próximo pedido de rollback. Aqui, para chegar ao
        botão, a pessoa passa pelo diff.
      */}
      {podeReverter && (
        <Inline gap={2}>
          <Button
            size="sm"
            variant="outline"
            disabled={ocupado}
            onClick={() => props.onReverter(pedido.id)}
          >
            Roll back
          </Button>
        </Inline>
      )}
    </Stack>
  );

  /*
    Histórico: uma linha que abre. O selo fica fora do gatilho — status é
    informação, não ação, e um alvo de clique que não faz nada engana.
  */
  if (!podeDecidir && !emDuvida) {
    return (
      <Disclosure
        summary={
          <div className="min-w-0">
            {titulo}
            <Procedencia pedido={pedido} revertidoPor={revertidoPor} />
          </div>
        }
        aside={selo}
      >
        {detalhe}
      </Disclosure>
    );
  }

  // Espera alguma coisa de alguém: carta aberta.
  return (
    <Card elevation="raised">
      <Stack gap={4}>
        <Inline justify="between" align="start" gap={3}>
          <Stack gap={1} className="min-w-0">
            {titulo}
            <Procedencia pedido={pedido} revertidoPor={revertidoPor} />
          </Stack>
          {selo}
        </Inline>

        {emDuvida ? (
          <Opcoes
            pedido={pedido}
            ocupado={ocupado}
            onEscolher={props.onEscolher}
            onEsclarecer={props.onEsclarecer}
          />
        ) : (
          detalhe
        )}

        {podeDecidir && (
          <Inline gap={2}>
            <Button size="sm" disabled={ocupado} onClick={() => props.onAprovar(pedido.id)}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={ocupado}
              onClick={() => props.onRejeitar(pedido.id)}
            >
              Reject
            </Button>
          </Inline>
        )}
      </Stack>
    </Card>
  );
}
