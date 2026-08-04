import { useEffect, useState } from "react";
import {
  Button,
  CardGrid,
  Container,
  EmptyState,
  Inline,
  Pagination,
  SearchField,
  Select,
  Stack,
  TooltipProvider,
  useTheme,
  TypeIcon,
} from "@pokedex/design-system";
import {
  POKEMON_TYPES,
  SPRITE_SETS,
  TYPE_LABELS,
  type GameMove,
  type GamePokemon,
  type GameType,
} from "../../game/rules";
import { listarPokemon, ApiOfflineError, type ApiPokemon } from "../../lib/api";
import { GameCard } from "./GameCard";
import { AgentPanel } from "../agent-chat/AgentPanel";

const POR_PAGINA = 24;

/**
 * Converte o formato da API para o que a carta consome.
 *
 * A API usa snake_case, como as colunas do Postgres; o front usa camelCase.
 * Traduzir aqui, num lugar só, evita espalhar `dex_number` e `game_power`
 * pelos componentes — e mantém `GameCard` indiferente à origem do dado.
 */
function paraCarta(p: ApiPokemon & { pokemon_moves?: unknown[] }): GamePokemon {
  const golpes = (p.pokemon_moves ?? []) as {
    attack_name: string;
    move_type: string;
    game_power: number;
  }[];

  return {
    id: p.id,
    dexNumber: p.dex_number,
    slug: p.slug,
    types: p.types as GameType[],
    abilities: [],
    sprites: p.sprites,
    moves: golpes.map(
      (m): GameMove => ({
        attackName: m.attack_name,
        moveType: m.move_type as GameType,
        power: m.game_power,
      }),
    ),
  };
}

/**
 * Consulta de cartas do jogo de tabuleiro.
 *
 * O propósito da tela: o jogador escolhe um **tipo de ataque** e vê quais
 * Pokémon aprendem um golpe daquele tipo, já com o valor convertido para a
 * escala do jogo. Não é um catálogo de espécies — é uma mesa de consulta.
 *
 * Os dados vêm da API, paginados: uma requisição por página, contra as ~15.000
 * que a versão original fazia à PokeAPI a cada abertura.
 *
 * O texto de interface é em inglês porque é a língua da mesa — os nomes dos
 * golpes, dos tipos e das cartas físicas já são. Misturar rótulo em português
 * com `Flare Blitz` e `Fire` fazia a tela falar duas línguas ao mesmo tempo.
 */
export function PokedexPage() {
  const { theme, toggle } = useTheme();

  const [busca, setBusca] = useState("");
  const [tipoDeAtaque, setTipoDeAtaque] = useState<string>("all");
  const [spriteKey, setSpriteKey] = useState<string>("generation-iii");
  const [pagina, setPagina] = useState(1);

  const [visiveis, setVisiveis] = useState<GamePokemon[] | null>(null);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Busca no servidor, com atraso.
   *
   * O filtro deixou de rodar em memória: agora é `ilike` no Postgres. Sem o
   * atraso, cada tecla digitada viraria uma requisição — "charizard" mandaria
   * nove, e a resposta da última não é necessariamente a que chega por último.
   * O AbortController resolve a corrida; os 300ms evitam a rajada.
   */
  useEffect(() => {
    const controller = new AbortController();
    const atraso = busca ? 300 : 0;

    const timer = setTimeout(() => {
      setErro(null);
      listarPokemon(
        { busca, tipoDeAtaque, pagina, porPagina: POR_PAGINA },
        controller.signal,
      )
        .then((r) => {
          setVisiveis(r.itens.map(paraCarta));
          setTotal(r.total);
        })
        .catch((e) => {
          if (e instanceof DOMException && e.name === "AbortError") return;
          setVisiveis([]);
          setErro(
            e instanceof ApiOfflineError
              ? "The API is not responding. Start it with `pnpm dev:api`."
              : e instanceof Error
                ? e.message
                : "Failed to load.",
          );
        });
    }, atraso);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [busca, tipoDeAtaque, pagina]);

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const temFiltro = busca !== "" || tipoDeAtaque !== "all";
  const carregando = visiveis === null;

  function limpar() {
    setBusca("");
    setTipoDeAtaque("all");
    setPagina(1);
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-surface">
        <Cabecalho theme={theme} onToggleTheme={toggle} />

        <Container className="pb-20 pt-8">
          <Stack gap={6}>
            {/* Ferramentas de consulta */}
            <div className="grid gap-4 lg:grid-cols-[1fr_16rem_11rem] lg:items-end">
              <SearchField
                label="Search Pokémon"
                placeholder="Name or number"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                onClear={() => setBusca("")}
              />

              <Select
                label="Learns attack of"
                value={tipoDeAtaque}
                onValueChange={(v) => {
                  setTipoDeAtaque(v);
                  setPagina(1);
                }}
                options={[
                  { value: "all", label: "Any type" },
                  ...POKEMON_TYPES.map((t) => ({
                    value: t,
                    label: TYPE_LABELS[t],
                    adornment: <TypeIcon type={t} size={16} />,
                  })),
                ]}
              />

              <Select
                label="Artwork"
                value={spriteKey}
                onValueChange={setSpriteKey}
                options={SPRITE_SETS.map((s) => ({
                  value: s.key,
                  label: s.label,
                }))}
              />
            </div>

            <Inline justify="between" align="center">
              <p className="text-sm text-text-muted" aria-live="polite">
                {carregando ? (
                  "Searching…"
                ) : (
                  <>
                    <strong className="font-semibold text-text">{total}</strong>{" "}
                    Pokémon
                    {tipoDeAtaque !== "all" && (
                      <>
                        {" "}
                        learn {TYPE_LABELS[tipoDeAtaque as GameType]} attacks
                      </>
                    )}
                  </>
                )}
              </p>
              {temFiltro && (
                <Button variant="ghost" size="sm" onClick={limpar}>
                  Clear
                </Button>
              )}
            </Inline>

            {erro ? (
              <EmptyState
                title="Could not load"
                description={erro}
                action={{ label: "Try again", onClick: () => location.reload() }}
              />
            ) : carregando ? (
              // Placeholders com a altura fixa da carta: a grade não desloca
              // quando o resultado chega.
              <CardGrid className="[--grid-card-min:19rem]">
                {Array.from({ length: POR_PAGINA }, (_, i) => (
                  <div
                    key={i}
                    className="h-[var(--game-card-height)] animate-pulse rounded-[var(--card-radius)] border border-border bg-surface-raised"
                  />
                ))}
              </CardGrid>
            ) : visiveis.length === 0 ? (
              <EmptyState
                title="No Pokémon found"
                description={
                  tipoDeAtaque !== "all" && busca
                    ? `No Pokémon matching "${busca}" learns a ${TYPE_LABELS[tipoDeAtaque as GameType]} attack.`
                    : busca
                      ? `Nothing matches "${busca}".`
                      : "No records for this filter."
                }
                action={{ label: "Clear filters", onClick: limpar }}
              />
            ) : (
              <>
                <CardGrid className="[--grid-card-min:19rem]">
                  {visiveis.map((p) => (
                    <GameCard
                      key={p.id}
                      pokemon={p}
                      spriteKey={spriteKey}
                      highlightMoveType={
                        tipoDeAtaque === "all" ? null : (tipoDeAtaque as GameType)
                      }
                    />
                  ))}
                </CardGrid>

                <Pagination
                  page={pagina}
                  totalPages={totalPaginas}
                  onPageChange={(p) => {
                    setPagina(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </>
            )}
          </Stack>
        </Container>
      </div>
    </TooltipProvider>
  );
}

function Cabecalho({
  theme,
  onToggleTheme,
}: {
  theme: string;
  onToggleTheme: () => void;
}) {
  return (
    <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-surface/85 backdrop-blur-md">
      <Container>
        <div className="flex h-[var(--header-height)] items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl font-semibold tracking-tight text-text">
              Pokédex
            </span>
            <span className="hidden font-mono text-2xs uppercase tracking-widest text-text-subtle sm:inline">
              Reference cards
            </span>
          </div>

          <Inline gap={1}>
            <AgentPanel />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
            >
              {theme === "dark" ? <SolIcon /> : <LuaIcon />}
            </Button>
          </Inline>
        </div>
      </Container>
    </header>
  );
}

function SolIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1v1.6M8 13.4V15M15 8h-1.6M2.6 8H1m11.95-4.95l-1.13 1.13M4.18 11.82l-1.13 1.13m0-9.9l1.13 1.13m7.64 7.64l1.13 1.13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LuaIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 9.6A5.8 5.8 0 016.4 2.5a5.8 5.8 0 107.1 7.1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
