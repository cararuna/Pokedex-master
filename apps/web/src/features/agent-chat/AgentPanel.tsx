import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Drawer,
  Inline,
  Stack,
} from "@pokedex/design-system";
import {
  askAgent,
  checkAgentHealth,
  AgentOfflineError,
  type AgentEvent,
} from "../../lib/agent-client";

/**
 * Painel do assistente.
 *
 * Mostra o que o agente está fazendo, e não só o que ele respondeu. Cada
 * consulta ao banco vira uma linha de atividade visível: "consultando ataques
 * de fogo…". Sem isso, o agente fica mudo por vários segundos enquanto encadeia
 * ferramentas, e a espera parece travamento.
 *
 * Também é o que torna o comportamento auditável na demonstração: dá para
 * mostrar que a resposta veio do banco, e não da memória do modelo.
 */

interface Mensagem {
  id: string;
  autor: "voce" | "agente";
  texto: string;
  /** Ferramentas que o agente consultou para produzir esta resposta. */
  atividades?: string[];
  meta?: { passos: number; tokens: number; custoUsd: number | null };
}

const NOMES_DE_FERRAMENTA: Record<string, string> = {
  buscar_pokemon: "Buscando Pokémon",
  ficha_do_pokemon: "Abrindo a ficha",
  vantagem_de_tipo: "Consultando vantagens",
  talentos_do_tipo: "Consultando talentos",
  explicar_regra_de_conversao: "Revendo a regra de conversão",
};

const EXEMPLOS = [
  "Quem aprende ataque de fogo com valor 10?",
  "Contra o que o tipo fantasma tem vantagem?",
  "Mostra a ficha do Charizard",
  "Por que um ataque vale 8 e não 3?",
];

export function AgentPanel() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [atividadeAtual, setAtividadeAtual] = useState<string[]>([]);
  const [saude, setSaude] = useState<
    { online: true; model: string } | { online: false } | null
  >(null);

  const fimDaLista = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionId = useRef(crypto.randomUUID());

  // Checa a API só quando o painel abre — não faz sentido pingar o backend
  // enquanto a pessoa está usando o catálogo.
  useEffect(() => {
    if (aberto && saude === null) {
      checkAgentHealth().then(setSaude);
    }
  }, [aberto, saude]);

  useEffect(() => {
    fimDaLista.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, atividadeAtual]);

  // Cancela o stream se o painel fechar no meio de uma resposta.
  useEffect(() => {
    if (!aberto) abortRef.current?.abort();
  }, [aberto]);

  async function enviar(texto: string) {
    const pergunta = texto.trim();
    if (!pergunta || ocupado) return;

    setMensagens((m) => [
      ...m,
      { id: crypto.randomUUID(), autor: "voce", texto: pergunta },
    ]);
    setEntrada("");
    setOcupado(true);
    setAtividadeAtual([]);

    const atividades: string[] = [];
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await askAgent(pergunta, {
        sessionId: sessionId.current,
        signal: controller.signal,
        onEvent: (evento: AgentEvent) => {
          if (evento.type === "tool_call") {
            const rotulo = NOMES_DE_FERRAMENTA[evento.name] ?? evento.name;
            atividades.push(rotulo);
            setAtividadeAtual([...atividades]);
          }

          if (evento.type === "done") {
            setMensagens((m) => [
              ...m,
              {
                id: crypto.randomUUID(),
                autor: "agente",
                texto: evento.answer,
                atividades: [...atividades],
                meta: {
                  passos: evento.steps,
                  tokens: evento.tokens,
                  custoUsd: evento.costUsd,
                },
              },
            ]);
          }

          if (evento.type === "error") {
            setMensagens((m) => [
              ...m,
              {
                id: crypto.randomUUID(),
                autor: "agente",
                texto: `Não consegui responder: ${evento.message}`,
              },
            ]);
          }
        },
      });
    } catch (e) {
      const offline = e instanceof AgentOfflineError;
      setSaude(offline ? { online: false } : saude);
      setMensagens((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          autor: "agente",
          texto: offline
            ? "A API do agente não está no ar. Suba com `pnpm dev:api` — e confira se o apps/api/.env está preenchido."
            : `Erro: ${e instanceof Error ? e.message : String(e)}`,
        },
      ]);
    } finally {
      setOcupado(false);
      setAtividadeAtual([]);
      abortRef.current = null;
    }
  }

  return (
    <Drawer open={aberto} onOpenChange={setAberto}>
      <Drawer.Trigger asChild>
        <Button variant="soft" size="sm" startIcon={<SparkIcon />}>
          Perguntar
        </Button>
      </Drawer.Trigger>

      <Drawer.Content aria-describedby={undefined}>
        <Drawer.Header>
          <Stack gap={0}>
            <Drawer.Title>Assistente de mesa</Drawer.Title>
            <span className="text-2xs text-text-subtle">
              {saude?.online
                ? `Conectado · ${saude.model}`
                : saude === null
                  ? "Verificando…"
                  : "API offline"}
            </span>
          </Stack>
          <Drawer.Close asChild>
            <Button variant="ghost" size="sm" iconOnly aria-label="Fechar assistente">
              <CloseIcon />
            </Button>
          </Drawer.Close>
        </Drawer.Header>

        <Drawer.Body className="px-4 py-4">
          {mensagens.length === 0 ? (
            <Stack gap={4}>
              <p className="text-sm leading-relaxed text-text-muted">
                Pergunte sobre as cartas, os ataques e as regras do jogo. As
                respostas vêm do banco de dados da partida — não da memória do
                modelo.
              </p>
              <Stack gap={2}>
                <p className="font-mono text-2xs uppercase tracking-widest text-text-subtle">
                  Exemplos
                </p>
                {EXEMPLOS.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => enviar(ex)}
                    disabled={ocupado}
                    className="rounded-[var(--r-sm)] border border-border bg-surface-raised px-3 py-2 text-left text-xs text-text transition-colors hover:border-border-strong hover:bg-surface-hover disabled:opacity-50 focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]"
                  >
                    {ex}
                  </button>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Stack gap={4}>
              {mensagens.map((m) => (
                <Bolha key={m.id} mensagem={m} />
              ))}
            </Stack>
          )}

          {ocupado && (
            <div className="mt-4">
              <Atividade rotulos={atividadeAtual} />
            </div>
          )}

          <div ref={fimDaLista} />
        </Drawer.Body>

        <Drawer.Footer>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(entrada);
            }}
            className="flex items-end gap-2"
          >
            <label htmlFor="agent-input" className="sr-only">
              Sua pergunta
            </label>
            <textarea
              id="agent-input"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              onKeyDown={(e) => {
                // Enter envia, Shift+Enter quebra linha — a convenção que
                // quem usa chat já espera.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar(entrada);
                }
              }}
              rows={2}
              placeholder="Quem aprende ataque de gelo?"
              disabled={ocupado}
              className="min-h-[2.5rem] flex-1 resize-none rounded-[var(--field-radius)] border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2 text-sm text-text transition-colors hover:border-[var(--field-border-hover)] disabled:opacity-60 focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]"
            />
            <Button type="submit" size="md" loading={ocupado} disabled={!entrada.trim()}>
              Enviar
            </Button>
          </form>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

function Bolha({ mensagem }: { mensagem: Mensagem }) {
  const seu = mensagem.autor === "voce";

  return (
    <div className={seu ? "flex justify-end" : ""}>
      <div className={seu ? "max-w-[85%]" : "w-full"}>
        {seu ? (
          <div className="rounded-[var(--r-md)] bg-accent-soft px-3 py-2 text-sm text-accent-text">
            {mensagem.texto}
          </div>
        ) : (
          <Stack gap={2}>
            {mensagem.atividades && mensagem.atividades.length > 0 && (
              <Inline gap={1}>
                {mensagem.atividades.map((a, i) => (
                  <Badge key={`${a}-${i}`} tone="neutral" size="sm">
                    {a}
                  </Badge>
                ))}
              </Inline>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-text">
              {mensagem.texto}
            </div>
            {mensagem.meta && (
              <p className="font-mono text-2xs text-text-subtle">
                {mensagem.meta.passos} passo
                {mensagem.meta.passos === 1 ? "" : "s"} ·{" "}
                {mensagem.meta.tokens.toLocaleString("pt-BR")} tokens
                {mensagem.meta.custoUsd !== null &&
                  ` · US$ ${mensagem.meta.custoUsd.toFixed(5)}`}
              </p>
            )}
          </Stack>
        )}
      </div>
    </div>
  );
}

/**
 * Atividade em curso.
 *
 * `aria-live="polite"` faz o leitor de tela anunciar cada consulta sem
 * interromper o que já estava sendo lido — mesma informação que a pessoa
 * vidente recebe pelos rótulos.
 */
function Atividade({ rotulos }: { rotulos: string[] }) {
  return (
    <Stack gap={2} aria-live="polite">
      {rotulos.map((r, i) => (
        <Inline key={`${r}-${i}`} gap={2} align="center">
          <span className="size-1.5 rounded-full bg-accent-solid" />
          <span className="text-xs text-text-muted">{r}…</span>
        </Inline>
      ))}
      {rotulos.length === 0 && (
        <Inline gap={2} align="center">
          <span className="size-1.5 animate-pulse rounded-full bg-accent-solid" />
          <span className="text-xs text-text-muted">Pensando…</span>
        </Inline>
      )}
    </Stack>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1l1.4 4.1L13.5 6.5 9.4 7.9 8 12 6.6 7.9 2.5 6.5l4.1-1.4L8 1zM13 10l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
