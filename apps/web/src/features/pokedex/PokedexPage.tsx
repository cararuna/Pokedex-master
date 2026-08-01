import { useMemo, useState } from "react";
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
} from "@pokedex/design-system";
import dataset from "../../game/dataset.json";
import {
  POKEMON_TYPES,
  SPRITE_SETS,
  TYPE_LABELS,
  type GamePokemon,
  type GameType,
} from "../../game/rules";
import { GameCard } from "./GameCard";
import { TypeIcon } from "./TypeIcon";

const POKEMON = dataset as unknown as GamePokemon[];
const POR_PAGINA = 24;

/**
 * Consulta de cartas do jogo de tabuleiro.
 *
 * O propósito da tela: o jogador escolhe um **tipo de ataque** e vê quais
 * Pokémon aprendem um golpe daquele tipo, já com o valor convertido para a
 * escala do jogo. Não é um catálogo de espécies — é uma mesa de consulta.
 *
 * Os dados vêm de `game/dataset.json`, gerado offline por
 * `scripts/build-dataset.mjs`. Zero requisição à PokeAPI em tempo de execução:
 * busca e filtro rodam sobre um array em memória e respondem na hora.
 *
 * Na Fase 2 este mesmo dataset vira as tabelas do Supabase e o import estático
 * é trocado por uma chamada paginada — sem mexer em componente nenhum.
 */
export function PokedexPage() {
  const { theme, toggle } = useTheme();

  const [busca, setBusca] = useState("");
  const [tipoDeAtaque, setTipoDeAtaque] = useState<string>("all");
  const [spriteKey, setSpriteKey] = useState<string>("generation-iii");
  const [pagina, setPagina] = useState(1);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return POKEMON.filter((p) => {
      // O filtro central: aprende ataque deste tipo?
      if (tipoDeAtaque !== "all") {
        if (!p.moves.some((m) => m.moveType === tipoDeAtaque)) return false;
      }
      if (!termo) return true;
      return p.slug.includes(termo) || String(p.dexNumber) === termo;
    }).sort((a, b) => {
      // Com filtro ativo, os de maior valor naquele tipo vêm primeiro — é a
      // pergunta real do jogador: "quem bate mais forte de fogo?"
      if (tipoDeAtaque !== "all") {
        const va = a.moves.find((m) => m.moveType === tipoDeAtaque)?.power ?? 0;
        const vb = b.moves.find((m) => m.moveType === tipoDeAtaque)?.power ?? 0;
        if (va !== vb) return vb - va;
      }
      return a.dexNumber - b.dexNumber;
    });
  }, [busca, tipoDeAtaque]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA,
  );

  const temFiltro = busca !== "" || tipoDeAtaque !== "all";

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
                label="Buscar Pokémon"
                placeholder="Nome ou número"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                onClear={() => setBusca("")}
              />

              <Select
                label="Aprende ataque de"
                value={tipoDeAtaque}
                onValueChange={(v) => {
                  setTipoDeAtaque(v);
                  setPagina(1);
                }}
                options={[
                  { value: "all", label: "Qualquer tipo" },
                  ...POKEMON_TYPES.map((t) => ({
                    value: t,
                    label: TYPE_LABELS[t],
                    adornment: <TypeIcon type={t} size={16} />,
                  })),
                ]}
              />

              <Select
                label="Arte"
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
                <strong className="font-semibold text-text">
                  {filtrados.length}
                </strong>{" "}
                {filtrados.length === 1 ? "Pokémon" : "Pokémon"}
                {tipoDeAtaque !== "all" && (
                  <> aprendem ataque de {TYPE_LABELS[tipoDeAtaque as GameType]}</>
                )}
              </p>
              {temFiltro && (
                <Button variant="ghost" size="sm" onClick={limpar}>
                  Limpar
                </Button>
              )}
            </Inline>

            {visiveis.length === 0 ? (
              <EmptyState
                title="Nenhum Pokémon encontrado"
                description={
                  tipoDeAtaque !== "all" && busca
                    ? `Nenhum Pokémon com "${busca}" aprende ataque de ${TYPE_LABELS[tipoDeAtaque as GameType]}.`
                    : busca
                      ? `Nada corresponde a "${busca}".`
                      : "Nenhum registro para este filtro."
                }
                action={{ label: "Limpar filtros", onClick: limpar }}
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
                  page={paginaSegura}
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
              Cartas de consulta
            </span>
          </div>

          <Inline gap={1}>
            <Button asChild variant="ghost" size="sm">
              <a href="/design-system">Design system</a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
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
