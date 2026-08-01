import { useEffect, useMemo, useState } from "react";
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
  TypeChip,
  POKEMON_TYPES,
  getTypeLabel,
  useTheme,
  type PokemonType,
} from "@pokedex/design-system";
import {
  fetchIndex,
  fetchPage,
  fetchSlugsByType,
  formatName,
  type PokemonDetail,
} from "../../lib/pokeapi";
import { PokemonCard, PokemonCardSkeleton } from "./PokemonCard";
import { PokemonDetailDialog } from "./PokemonDetailDialog";

const POR_PAGINA = 24;

/**
 * Tela principal do catálogo.
 *
 * Reescrita completa de `MovimentosCompletos`. As diferenças estruturais:
 *
 *   antes                                  agora
 *   ─────────────────────────────────────  ──────────────────────────────────
 *   ~15.000 requisições na abertura        1 no índice + 24 por página
 *   tudo em memória, sem paginação         página de 24, com cache
 *   filtro de tipo varrendo o que baixou   endpoint /type, 1 requisição
 *   spinner central com texto              skeleton com a forma do conteúdo
 *   sem tratamento de vazio ou erro        EmptyState nos dois casos
 */
export function PokedexPage() {
  const { theme, toggle } = useTheme();

  const [indice, setIndice] = useState<{ slug: string; id: number }[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<string>("all");
  const [slugsDoTipo, setSlugsDoTipo] = useState<Set<string> | null>(null);
  const [pagina, setPagina] = useState(1);

  const [visiveis, setVisiveis] = useState<PokemonDetail[] | null>(null);
  const [selecionado, setSelecionado] = useState<PokemonDetail | null>(null);

  /* Índice — uma vez por sessão. */
  useEffect(() => {
    fetchIndex()
      .then(setIndice)
      .catch(() =>
        setErro(
          "Não foi possível falar com a PokeAPI. Verifique sua conexão e tente de novo.",
        ),
      );
  }, []);

  /* Filtro de tipo — uma requisição resolve a lista inteira. */
  useEffect(() => {
    if (tipo === "all") {
      setSlugsDoTipo(null);
      return;
    }
    let ativo = true;
    fetchSlugsByType(tipo).then((s) => ativo && setSlugsDoTipo(s));
    return () => {
      ativo = false;
    };
  }, [tipo]);

  /* Busca e filtro rodam sobre o índice, sem tocar na rede. */
  const filtrados = useMemo(() => {
    if (!indice) return [];
    const termo = busca.trim().toLowerCase();

    return indice.filter((p) => {
      if (slugsDoTipo && !slugsDoTipo.has(p.slug)) return false;
      if (!termo) return true;
      // Aceita nome e número: quem procura "25" quer o Pikachu.
      return p.slug.includes(termo) || String(p.id) === termo;
    });
  }, [indice, busca, slugsDoTipo]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));

  /* Volta para a primeira página quando o resultado muda — senão a pessoa
     filtra e cai numa página vazia que existia só no conjunto anterior. */
  useEffect(() => {
    setPagina(1);
  }, [busca, tipo]);

  /* Detalhes só da página atual. */
  useEffect(() => {
    if (!indice) return;

    const inicio = (pagina - 1) * POR_PAGINA;
    const slugs = filtrados.slice(inicio, inicio + POR_PAGINA).map((p) => p.slug);

    if (slugs.length === 0) {
      setVisiveis([]);
      return;
    }

    let ativo = true;
    setVisiveis(null);
    fetchPage(slugs)
      .then((r) => ativo && setVisiveis(r))
      .catch(() => ativo && setErro("Falha ao carregar esta página."));

    return () => {
      ativo = false;
    };
  }, [indice, filtrados, pagina]);

  const carregando = indice === null || visiveis === null;

  return (
    <TooltipProvider>
      <div className="min-h-dvh bg-surface">
        <Cabecalho theme={theme} onToggleTheme={toggle} />

        <Container className="pb-20 pt-10">
          <Stack gap={8}>
            {/* Barra de ferramentas */}
            <div className="grid gap-4 sm:grid-cols-[1fr_15rem] sm:items-end">
              <SearchField
                label="Buscar espécime"
                placeholder="Nome ou número da Pokédex"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onClear={() => setBusca("")}
                size="lg"
              />
              <Select
                label="Tipo"
                size="lg"
                value={tipo}
                onValueChange={setTipo}
                options={[
                  { value: "all", label: "Todos os tipos" },
                  ...POKEMON_TYPES.map((t) => ({
                    value: t,
                    label: getTypeLabel(t),
                    adornment: <TypeChip type={t} size="sm" iconOnly />,
                  })),
                ]}
              />
            </div>

            {/* Contagem e filtros ativos */}
            {!erro && (
              <Inline justify="between" align="center">
                <p className="text-sm text-text-muted" aria-live="polite">
                  {indice
                    ? `${filtrados.length} ${filtrados.length === 1 ? "espécime" : "espécimes"}`
                    : "Carregando catálogo…"}
                </p>
                {(busca || tipo !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBusca("");
                      setTipo("all");
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </Inline>
            )}

            {/* Conteúdo */}
            {erro ? (
              <EmptyState
                title="Não foi possível carregar"
                description={erro}
                action={{ label: "Tentar de novo", onClick: () => location.reload() }}
              />
            ) : carregando ? (
              <CardGrid aria-busy="true" aria-label="Carregando espécimes">
                {Array.from({ length: POR_PAGINA }, (_, i) => (
                  <PokemonCardSkeleton key={i} />
                ))}
              </CardGrid>
            ) : visiveis.length === 0 ? (
              <EmptyState
                title="Nenhum espécime encontrado"
                description={
                  busca
                    ? `Nada corresponde a "${busca}"${tipo !== "all" ? ` no tipo ${getTypeLabel(tipo as PokemonType)}` : ""}.`
                    : "Nenhum registro para este filtro."
                }
                action={{
                  label: "Limpar filtros",
                  onClick: () => {
                    setBusca("");
                    setTipo("all");
                  },
                }}
              />
            ) : (
              <>
                <CardGrid>
                  {visiveis.map((p) => (
                    <PokemonCard key={p.id} pokemon={p} onSelect={setSelecionado} />
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

        <PokemonDetailDialog
          pokemon={selecionado}
          onClose={() => setSelecionado(null)}
        />
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
              Catálogo de espécimes
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

export { formatName };
