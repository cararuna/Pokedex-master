import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Container,
  Divider,
  EmptyState,
  Inline,
  SearchField,
  Skeleton,
  Stack,
  Textarea,
} from "@pokedex/design-system";
import {
  aprovar,
  escolher,
  esclarecer,
  listarMudancas,
  NaoAutenticado,
  proporMudanca,
  quemSouEu,
  rejeitar,
  reverter,
  salvarToken,
  tokenSalvo,
  verificarToken,
  type ChangeRequest,
  type Me,
} from "../../lib/changes-client";
import { ChangeCard } from "./ChangeCard";

/**
 * Inbox de mudanças.
 *
 * **Por que não dentro do assistente de mesa.** A tentação era usar o chat que
 * já existe: uma conversa só, o jogador pergunta e também pede correções. Não
 * fizemos, e o motivo é de intenção, não de layout. O assistente responde
 * perguntas — nada do que ele faz muda o jogo. Misturar escrita ali dentro
 * transformaria *toda* mensagem numa possível mudança, e quem digita
 * "Charizard's fire is 9, right?" não está pedindo para gravar 9.
 *
 * A separação também é o que torna a fila auditável: aqui cada pedido é uma
 * unidade discreta, com estado, autor e diff. Numa conversa, ele seria uma
 * linha no meio de outras cinquenta.
 *
 * O que se aproveita da conversa é o **ritmo**: você escreve em linguagem
 * natural e recebe uma resposta. Só que a resposta é uma proposta revisável,
 * não um parágrafo.
 */

/* ── Porta de entrada ─────────────────────────────────────────────────────── */

function PortaDeEntrada({ onEntrar }: { onEntrar: (eu: Me) => void }) {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      onEntrar(await verificarToken(valor.trim()));
    } catch (err) {
      setErro(
        err instanceof NaoAutenticado
          ? "That token is not valid, or it was revoked."
          : err instanceof Error
            ? err.message
            : "Something went wrong.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <form onSubmit={entrar}>
        <Stack gap={4}>
          <Stack gap={1}>
            <h1 className="text-lg font-semibold">Change requests</h1>
            <p className="text-sm text-text-muted">
              Paste your access token. Ask the game master for one.
            </p>
          </Stack>

          <SearchField
            label="Access token"
            placeholder="pkdx_…"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            error={erro ?? undefined}
            autoFocus
          />

          <Button type="submit" loading={enviando} disabled={!valor.trim()} fullWidth>
            Continue
          </Button>
        </Stack>
      </form>
    </Card>
  );
}

/* ── Compositor ───────────────────────────────────────────────────────────── */

function Compositor({
  eu,
  onProposto,
}: {
  eu: Me;
  onProposto: (pedido: ChangeRequest) => void;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpo = texto.trim();
    if (limpo.length < 3) return;

    setEnviando(true);
    setErro(null);
    try {
      onProposto(await proporMudanca(limpo));
      setTexto("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card>
      <form onSubmit={enviar}>
        <Stack gap={3}>
          <Textarea
            label="Describe the change"
            hint={`Plain language. It becomes a proposal you review before anything is written. Up to ${eu.proposalsPerHour} per hour.`}
            placeholder="Charizard's fire attack should be worth 10"
            value={texto}
            maxLength={500}
            showCount
            rows={3}
            onChange={(e) => setTexto(e.target.value)}
            error={erro ?? undefined}
            // Enter envia, Shift+Enter quebra linha — o gesto de chat. O
            // formulário continua submetendo pelo botão, então quem navega por
            // teclado sem conhecer o atalho não fica sem saída.
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void enviar(e as unknown as React.FormEvent);
              }
            }}
          />
          <Inline justify="end">
            <Button type="submit" loading={enviando} disabled={texto.trim().length < 3}>
              Propose
            </Button>
          </Inline>
        </Stack>
      </form>
    </Card>
  );
}

/* ── Página ───────────────────────────────────────────────────────────────── */

export function ChangesPage() {
  const [eu, setEu] = useState<Me | null>(null);
  const [pedidos, setPedidos] = useState<ChangeRequest[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setPedidos(await listarMudancas());
    } catch (err) {
      if (err instanceof NaoAutenticado) setEu(null);
      else {
        setErro(err instanceof Error ? err.message : "Something went wrong.");
        // Sai de `null` mesmo falhando. `null` é "ainda carregando", e é o que
        // desenha o esqueleto — deixar assim depois de um erro mostrava a
        // mensagem de falha com dois blocos pulsando embaixo, para sempre.
        setPedidos([]);
      }
    }
  }, []);

  // Retoma a sessão com o token guardado, se ele ainda valer.
  useEffect(() => {
    if (!tokenSalvo()) return;
    quemSouEu()
      .then(setEu)
      .catch(() => setEu(null));
  }, []);

  useEffect(() => {
    if (eu) void carregar();
  }, [eu, carregar]);

  /**
   * Uma decisão de cada vez.
   *
   * `ocupado` desabilita todos os botões da lista, não só o do cartão clicado.
   * Aprovar dois pedidos em paralelo faria o segundo ler um estado que o
   * primeiro ainda estava escrevendo — e é exatamente esse caso que a detecção
   * de drift no servidor recusaria, transformando um clique apressado numa
   * falha que precisa ser reenviada.
   */
  async function decidir(acao: () => Promise<ChangeRequest>) {
    setOcupado(true);
    setErro(null);
    try {
      const atualizado = await acao();
      // Recarrega a lista inteira: um rollback cria uma linha nova e muda o
      // estado da original, então trocar só o item devolvido deixaria a tela
      // mostrando metade do resultado.
      await carregar();
      if (atualizado.status === "failed") setErro(atualizado.error);
    } catch (err) {
      if (err instanceof NaoAutenticado) setEu(null);
      else setErro(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setOcupado(false);
    }
  }

  if (!eu) {
    return (
      <Container className="py-16">
        <PortaDeEntrada onEntrar={setEu} />
      </Container>
    );
  }

  /**
   * Uma seção da fila.
   *
   * Declarada aqui dentro para fechar sobre `eu`, `ocupado` e os despachos —
   * eram sete props repetidas em cada bloco, e a terceira seção teria feito a
   * repetição virar o lugar óbvio para uma delas ficar para trás.
   */
  function Secao({
    titulo,
    itens,
    separar = false,
  }: {
    titulo: string;
    itens: ChangeRequest[];
    separar?: boolean;
  }) {
    if (itens.length === 0) return null;

    return (
      <Stack gap={3}>
        {separar && <Divider />}
        <Inline gap={2} align="baseline">
          <h2 className="text-sm font-semibold text-text-muted">{titulo}</h2>
          <span className="text-xs tabular-nums text-text-subtle">{itens.length}</span>
        </Inline>
        {itens.map((p) => (
          <ChangeCard
            key={p.id}
            pedido={p}
            eu={eu!}
            revertidoPor={desfeitoPor.get(p.id)}
            ocupado={ocupado}
            onAprovar={(id) => void decidir(() => aprovar(id))}
            onRejeitar={(id) => void decidir(() => rejeitar(id))}
            onReverter={(id) => void decidir(() => reverter(id))}
            onEscolher={(id, i) => void decidir(() => escolher(id, i))}
            onEsclarecer={(id, t) => void decidir(() => esclarecer(id, t))}
          />
        ))}
      </Stack>
    );
  }

  /**
   * Um rollback bem-sucedido é dobrado na linha que ele desfez.
   *
   * No banco ele é uma linha própria, e continua sendo — o histórico é
   * append-only e é assim que se lê a mesa de trás para frente. Mas na tela
   * ele aparecia como uma **segunda carta idêntica**, com a mesma operação e a
   * mesma tabela invertida, logo acima da original. O efeito era de tela
   * duplicada, e escondia o que a lista deveria mostrar: quantas mudanças
   * distintas houve.
   *
   * Um rollback que **falhou** continua visível. Ali a linha extra é a
   * informação: o desfazer não aconteceu, e some-la deixaria a original
   * marcada como revertida sem que o dado tivesse voltado.
   */
  const dobrado = (p: ChangeRequest) => Boolean(p.rollback_of) && p.status === "applied";

  const desfeitoPor = new Map<string, string>();
  for (const p of pedidos ?? []) {
    if (dobrado(p)) desfeitoPor.set(p.rollback_of!, p.requested_by ?? "unknown");
  }

  const visiveis = (pedidos ?? []).filter((p) => !dobrado(p));

  /**
   * Três seções, e a ordem é a de quem está esperando por quem.
   *
   *   1. esperando você        o sistema perguntou e a bola está com quem pediu
   *   2. esperando análise     a proposta está pronta e falta decidir
   *   3. histórico             já resolvido; abre no clique de quem quiser ver
   *
   * A primeira vem antes da segunda porque um pedido em dúvida está **parado**:
   * ninguém consegue aprová-lo, e ele não sai do lugar até alguém responder.
   * No fim da lista, ficaria esquecido justamente por não ter botão de ação
   * nas seções que a pessoa costuma olhar.
   */
  const emDuvida = visiveis.filter((p) => p.status === "needs_clarification");
  const pendentes = visiveis.filter((p) => p.status === "proposed");
  const historico = visiveis.filter(
    (p) => p.status !== "proposed" && p.status !== "needs_clarification",
  );

  return (
    <Container className="py-8">
      <Stack gap={6}>
        <Inline justify="between" align="center" gap={3}>
          <Stack gap={1}>
            <h1 className="text-xl font-semibold">Change requests</h1>
            <p className="text-sm text-text-muted">{eu.description}</p>
          </Stack>
          <Inline gap={2} align="center">
            <Badge tone="accent" variant="soft">
              {eu.label} · {eu.role}
            </Badge>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Back to the table</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                salvarToken(null);
                setEu(null);
                setPedidos(null);
              }}
            >
              Sign out
            </Button>
          </Inline>
        </Inline>

        {eu.capabilities.includes("changes:propose") && (
          <Compositor
            eu={eu}
            onProposto={(p) => setPedidos((atual) => [p, ...(atual ?? [])])}
          />
        )}

        {erro && (
          <p role="alert" className="text-sm text-danger-text">
            {erro}
          </p>
        )}

        {pedidos === null ? (
          <Stack gap={3}>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </Stack>
        ) : pedidos.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Describe a change above and it will show up as a proposal to review."
          />
        ) : (
          <Stack gap={8}>
            <Secao titulo="Waiting on you" itens={emDuvida} />
            <Secao titulo="Pending review" itens={pendentes} />
            <Secao titulo="History" itens={historico} separar />
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
