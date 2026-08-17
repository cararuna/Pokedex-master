import { Badge, Button, Card, Inline, Stack, Table } from "@pokedex/design-system";
import type { ChangeRequest, ChangeStatus, Me, Mudanca } from "../../lib/changes-client";

/**
 * Um pedido de mudança, do jeito que a mesa precisa ler antes de decidir.
 *
 * A hierarquia da carta é a ordem em que a decisão se forma:
 *
 *   1. o que muda        a frase da operação, em uma linha
 *   2. o diff            antes → depois, campo a campo
 *   3. por que           o raciocínio do modelo
 *   4. decidir           os botões
 *
 * O diff vem antes do raciocínio de propósito. Aprovar lendo só a justificativa
 * é aprovar a explicação, não a mudança — e a explicação é a parte escrita pelo
 * modelo, que é justamente a que não se deve tomar por verdade.
 */

const STATUS: Record<
  ChangeStatus,
  { rotulo: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" | "info" }
> = {
  proposed: { rotulo: "Awaiting approval", tone: "accent" },
  approved: { rotulo: "Applying", tone: "info" },
  applied: { rotulo: "Applied", tone: "success" },
  rejected: { rotulo: "Rejected", tone: "neutral" },
  failed: { rotulo: "Failed", tone: "danger" },
  rolled_back: { rotulo: "Rolled back", tone: "warning" },
  unsupported: { rotulo: "Not supported", tone: "neutral" },
  denied: { rotulo: "Not allowed", tone: "warning" },
};

/**
 * Valor de célula, legível.
 *
 * `undefined` vira "—" e não "undefined": o diff mostra campo que apareceu ou
 * sumiu, e nesses casos um dos lados não existe. Texto longo entra inteiro, sem
 * corte — é justamente a descrição de talento que a pessoa precisa reler antes
 * de aprovar, e cortá-la esconderia o que ela veio conferir.
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

export interface ChangeCardProps {
  pedido: ChangeRequest;
  eu: Me;
  ocupado: boolean;
  onAprovar: (id: string) => void;
  onRejeitar: (id: string) => void;
  onReverter: (id: string) => void;
}

export function ChangeCard({
  pedido,
  eu,
  ocupado,
  onAprovar,
  onRejeitar,
  onReverter,
}: ChangeCardProps) {
  const estado = STATUS[pedido.status];
  const podeDecidir = pedido.status === "proposed" && eu.capabilities.includes("changes:approve");
  const podeReverter =
    pedido.status === "applied" && eu.capabilities.includes("changes:rollback");

  return (
    <Card elevation={pedido.status === "proposed" ? "raised" : "flat"}>
      <Stack gap={4}>
        <Inline justify="between" align="start" gap={3}>
          <Stack gap={1}>
            {/* A frase da operação é o título — não o texto que a pessoa
                escreveu. O que se aprova é o que o sistema entendeu. */}
            <p className="text-sm font-semibold">
              {pedido.summary ?? pedido.request_text}
            </p>
            <p className="text-xs text-text-subtle">
              “{pedido.request_text}” · {pedido.requested_by ?? "unknown"}
              {pedido.decided_by && pedido.decided_by !== pedido.requested_by
                ? ` · decided by ${pedido.decided_by}`
                : ""}
            </p>
          </Stack>
          <Badge tone={estado.tone} dot>
            {estado.rotulo}
          </Badge>
        </Inline>

        <Diff mudancas={pedido.changes} />

        {pedido.rationale && (
          <p className="text-xs leading-relaxed text-text-muted">{pedido.rationale}</p>
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

        {(podeDecidir || podeReverter) && (
          <Inline gap={2}>
            {podeDecidir && (
              <>
                <Button size="sm" disabled={ocupado} onClick={() => onAprovar(pedido.id)}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={ocupado}
                  onClick={() => onRejeitar(pedido.id)}
                >
                  Reject
                </Button>
              </>
            )}
            {podeReverter && (
              <Button
                size="sm"
                variant="outline"
                disabled={ocupado}
                onClick={() => onReverter(pedido.id)}
              >
                Roll back
              </Button>
            )}
          </Inline>
        )}
      </Stack>
    </Card>
  );
}
