import { useEffect, useId, useState } from "react";
import { Skeleton, Tooltip } from "@pokedex/design-system";
import {
  formatMoveName,
  formatName,
  getAdvantages,
  TYPE_LABELS,
  type GameMove,
  type GamePokemon,
  type GameType,
} from "../../game/rules";
import { obterPokemon, type ApiPokemonDetail } from "../../lib/api";
import { TypeIcon } from "./TypeIcon";

/**
 * Cache do verso, por sessão.
 *
 * Talentos e habilidades vinham de `talentTrees.ts`, importado no bundle.
 * Agora vêm do banco — mas só quando a carta é virada. Carregá-los na
 * listagem multiplicaria por 24 um dado que a maioria das cartas nunca mostra.
 */
const versoCache = new Map<string, ApiPokemonDetail>();

/**
 * Carta de referência do jogo de tabuleiro.
 *
 * Não é um cartão de Pokédex: é a consulta que o jogador faz na mesa. A
 * informação central são os **golpes já convertidos para a escala do jogo**
 * (8, 9 ou 10), um por tipo, com as vantagens de cada um.
 *
 * ── O que foi preservado da carta original ───────────────────────────────
 *
 * Os símbolos de tipagem são os mesmos das cartas físicas. A lista de golpes
 * continua na frente, com valor e vantagens. O verso segue trazendo a árvore
 * de talentos por tipo e as habilidades inatas, e ainda se chega nele por um
 * giro da carta.
 *
 * ── O que mudou ──────────────────────────────────────────────────────────
 *
 * A cor do tipo deixou de inundar o cartão atrás de uma borda de 24px e virou
 * pigmento: fio de cor no topo, halo atrás da arte, tinta nos símbolos. O
 * papel é o mesmo do resto do sistema, então trinta cartas lado a lado leem
 * como um catálogo, e não como trinta retângulos brigando.
 *
 * O giro agora é um `<button>` com `aria-expanded` e `aria-controls`, e a face
 * escondida recebe `inert`. Na versão anterior o verso era um `div` invisível
 * para leitor de tela e alcançável por Tab mesmo virado para trás.
 */

interface Props {
  pokemon: GamePokemon;
  spriteKey: string;
  /** Tipo de ataque em destaque — o que o jogador filtrou. */
  highlightMoveType?: GameType | null;
}

export function GameCard({ pokemon, spriteKey, highlightMoveType }: Props) {
  const [flipped, setFlipped] = useState(false);
  const backId = useId();

  const sprite =
    pokemon.sprites[spriteKey] ??
    pokemon.sprites.artwork ??
    pokemon.sprites.default;

  const primary = pokemon.types[0];

  return (
    <div
      // Altura fixa vinda do token, igual em toda carta e nas duas faces.
      // Fica no elemento externo para que a grade reserve o espaço certo
      // antes de qualquer conteúdo renderizar.
      className="group h-[var(--game-card-height)] [perspective:1600px]"
      style={{ "--type": `var(--color-type-${primary})` } as React.CSSProperties}
    >
      <div
        className={[
          "relative h-full w-full",
          "transition-transform duration-[520ms] [transform-style:preserve-3d]",
          "ease-[cubic-bezier(0.22,1,0.36,1)]",
          "motion-reduce:transition-none",
          flipped ? "[transform:rotateY(180deg)]" : "",
        ].join(" ")}
      >
        {/* As duas faces ocupam o mesmo retângulo, sobrepostas. A frente
            também é absoluta — se fosse `relative`, ela ditaria a altura e
            cartas com mais ataques ficariam mais altas que as outras. */}
        <Face hidden={flipped}>
          <FrenteDaCarta
            pokemon={pokemon}
            sprite={sprite}
            highlightMoveType={highlightMoveType}
            onFlip={() => setFlipped(true)}
            backId={backId}
            flipped={flipped}
          />
        </Face>

        <Face back hidden={!flipped} id={backId}>
          <VersoDaCarta
            pokemon={pokemon}
            onFlip={() => setFlipped(false)}
            ativo={flipped}
          />
        </Face>
      </div>
    </div>
  );
}

/**
 * Uma face da carta.
 *
 * `inert` na face virada para trás é o detalhe que importa: sem ele, o Tab
 * continua entrando nos botões do verso enquanto a frente está visível, e a
 * pessoa perde o foco para um lugar que não existe na tela.
 */
function Face({
  children,
  back = false,
  hidden,
  id,
}: {
  children: React.ReactNode;
  back?: boolean;
  hidden: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      // @ts-expect-error — `inert` só entrou nos tipos do React em versões recentes
      inert={hidden ? "" : undefined}
      aria-hidden={hidden || undefined}
      className={[
        "absolute inset-0",
        "flex flex-col overflow-hidden",
        "rounded-[var(--card-radius)] border border-[var(--card-border)]",
        "bg-[var(--card-bg)] shadow-[var(--card-shadow)]",
        "[backface-visibility:hidden]",
        back ? "[transform:rotateY(180deg)]" : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ── Frente ─────────────────────────────────────────────────────────────── */

function FrenteDaCarta({
  pokemon,
  sprite,
  highlightMoveType,
  onFlip,
  backId,
  flipped,
}: {
  pokemon: GamePokemon;
  sprite: string | null;
  highlightMoveType?: GameType | null;
  onFlip: () => void;
  backId: string;
  flipped: boolean;
}) {
  return (
    <>
      {/* Fio de cor do tipo no topo. Substitui a borda de 24px: identifica o
          tipo à distância sem tomar a carta. */}
      <div aria-hidden="true" className="h-[3px] w-full bg-[var(--type)]" />

      <header className="flex shrink-0 items-start justify-between gap-2 px-4 pt-3.5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-2xs tabular-nums text-text-subtle">
            N.º {String(pokemon.dexNumber).padStart(3, "0")}
          </span>
          <h3 className="truncate font-display text-lg font-semibold leading-tight tracking-tight text-text">
            {formatName(pokemon.slug)}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1 pt-1">
          {pokemon.types.map((t) => (
            <Tooltip key={t} content={TYPE_LABELS[t]}>
              <span className="grid size-6 place-items-center">
                <TypeIcon type={t} size={20} />
              </span>
            </Tooltip>
          ))}
        </div>
      </header>

      {/* Arte */}
      <div className="relative grid h-32 shrink-0 place-items-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.16]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, var(--type) 0%, transparent 65%)",
          }}
        />
        {sprite ? (
          <img
            src={sprite}
            alt=""
            loading="lazy"
            className="relative h-28 object-contain [image-rendering:pixelated] transition-transform duration-[280ms] ease-out group-hover:scale-105"
          />
        ) : (
          <span className="relative text-xs text-text-subtle">sem arte</span>
        )}
      </div>

      {/* Golpes — o conteúdo que importa na mesa.
          `min-h-0` é obrigatório: sem ele um filho flex não encolhe abaixo do
          próprio conteúdo, o overflow nunca ativa e a lista estoura a carta.
          A rolagem aqui é rede de segurança — em 34rem os 9 ataques do pior
          caso já cabem. */}
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-border-subtle px-3 py-2">
        <p className="px-1 pb-1.5 font-mono text-2xs uppercase tracking-widest text-text-subtle">
          Ataques
        </p>
        {pokemon.moves.length === 0 ? (
          <p className="px-1 py-2 text-xs text-text-subtle">
            Não aprende ataques com dano.
          </p>
        ) : (
          <ul className="flex flex-col">
            {pokemon.moves.map((move) => (
              <MoveRow
                key={move.moveType}
                move={move}
                destacado={highlightMoveType === move.moveType}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="shrink-0 border-t border-border-subtle px-3 py-2">
        <button
          type="button"
          onClick={onFlip}
          aria-expanded={flipped}
          aria-controls={backId}
          className="flex w-full items-center justify-center gap-1.5 rounded-[var(--r-sm)] py-1.5 text-xs font-medium text-text-muted transition-colors duration-[130ms] hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]"
        >
          <FlipIcon />
          Talentos e habilidades
        </button>
      </footer>
    </>
  );
}

/**
 * Linha de ataque: símbolo, nome, valor do jogo e vantagens.
 *
 * O valor não é o dano da série — é o resultado da conversão do tabuleiro,
 * sempre 8, 9 ou 10. Fica em mono e tabular para as colunas alinharem entre
 * uma linha e outra.
 */
function MoveRow({ move, destacado }: { move: GameMove; destacado: boolean }) {
  const vantagens = getAdvantages(move.moveType);

  return (
    <li
      className="flex items-center gap-2 rounded-[var(--r-sm)] px-1 py-1 transition-colors duration-[130ms]"
      // A cor do destaque depende do tipo, que é dado em tempo de execução —
      // classe estática do Tailwind não alcança. O token continua sendo a
      // fonte do valor; só a composição acontece aqui.
      style={
        destacado
          ? {
              backgroundColor: `color-mix(in oklab, var(--color-type-${move.moveType}) 16%, transparent)`,
              boxShadow: `inset 2px 0 0 var(--color-type-${move.moveType})`,
            }
          : undefined
      }
    >
      <TypeIcon type={move.moveType} size={18} />

      <span className="min-w-0 flex-1 truncate text-xs text-text">
        {formatMoveName(move.attackName)}
      </span>

      {vantagens.length > 0 && (
        <Tooltip
          content={`Vantagem contra ${vantagens.map((v) => TYPE_LABELS[v]).join(", ")}`}
        >
          <span className="flex items-center gap-px opacity-70">
            {vantagens.map((v) => (
              <TypeIcon key={v} type={v} size={11} />
            ))}
          </span>
        </Tooltip>
      )}

      <span
        className="grid size-5 shrink-0 place-items-center rounded-[var(--r-xs)] font-mono text-2xs font-semibold tabular-nums text-text-on-solid"
        style={{ backgroundColor: `var(--color-type-${move.moveType})` }}
        title={`Valor no jogo: ${move.power}`}
      >
        {move.power}
      </span>
    </li>
  );
}

/* ── Verso ──────────────────────────────────────────────────────────────── */

function VersoDaCarta({
  pokemon,
  onFlip,
  ativo,
}: {
  pokemon: GamePokemon;
  onFlip: () => void;
  /** Só busca quando a carta é realmente virada. */
  ativo: boolean;
}) {
  const [dados, setDados] = useState<ApiPokemonDetail | null>(
    () => versoCache.get(pokemon.slug) ?? null,
  );
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!ativo || dados) return;

    const controller = new AbortController();
    obterPokemon(pokemon.slug, controller.signal)
      .then((d) => {
        versoCache.set(pokemon.slug, d);
        setDados(d);
      })
      .catch((e) => {
        // Abortar ao fechar a carta não é erro — só cancelamento.
        if (e instanceof DOMException && e.name === "AbortError") return;
        setErro(true);
      });

    return () => controller.abort();
  }, [ativo, dados, pokemon.slug]);

  const inatas = dados?.habilidades_inatas ?? [];
  const talentosPorTipo = new Map<string, ApiPokemonDetail["talentos"]>();
  for (const t of dados?.talentos ?? []) {
    talentosPorTipo.set(t.type, [...(talentosPorTipo.get(t.type) ?? []), t]);
  }

  return (
    <>
      <div aria-hidden="true" className="h-[3px] w-full bg-[var(--type)]" />

      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <h3 className="truncate font-display text-base font-semibold tracking-tight text-text">
          {formatName(pokemon.slug)}
        </h3>
        <button
          type="button"
          onClick={onFlip}
          className="grid size-6 shrink-0 place-items-center rounded-[var(--r-sm)] text-text-subtle transition-colors hover:bg-surface-hover hover:text-text focus-visible:outline-none focus-visible:[box-shadow:var(--focus-ring-shadow)]"
        >
          <span className="sr-only">Voltar para a frente da carta</span>
          <FlipIcon />
        </button>
      </header>

      {/* O verso rola de verdade: a árvore de talentos de um Pokémon de dois
          tipos mais as inatas passa de 34rem com frequência. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {erro ? (
          <p className="py-4 text-xs text-danger-text">
            Não foi possível carregar os talentos.
          </p>
        ) : !dados ? (
          <div className="flex flex-col gap-2" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height={38} />
            ))}
          </div>
        ) : (
        <div className="flex flex-col gap-4">
          {pokemon.types.map((type) => {
            const talentos = talentosPorTipo.get(type);
            if (!talentos?.length) return null;

            return (
              <section key={type}>
                <h4 className="mb-1.5 flex items-center gap-1.5 font-mono text-2xs uppercase tracking-widest text-text-subtle">
                  <TypeIcon type={type} size={14} />
                  {TYPE_LABELS[type]}
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {talentos.map((t) => (
                    <TalentItem
                      key={t.name}
                      nome={t.name}
                      descricao={t.description}
                    />
                  ))}
                </ul>
              </section>
            );
          })}

          {inatas.length > 0 && (
            <section>
              <h4 className="mb-1.5 font-mono text-2xs uppercase tracking-widest text-highlight-text">
                Habilidades inatas
              </h4>
              <ul className="flex flex-col gap-1.5">
                {inatas.map((t) => (
                  <TalentItem
                    key={t.name}
                    nome={t.name}
                    descricao={t.description}
                    destaque
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
        )}
      </div>
    </>
  );
}

function TalentItem({
  nome,
  descricao,
  destaque = false,
}: {
  nome: string;
  descricao: string;
  destaque?: boolean;
}) {
  return (
    <li
      className={[
        "rounded-[var(--r-sm)] px-2 py-1.5",
        destaque ? "bg-highlight-soft" : "bg-surface-sunken",
      ].join(" ")}
    >
      <p
        className={[
          "text-xs font-semibold",
          destaque ? "text-highlight-text" : "text-text",
        ].join(" ")}
      >
        {nome}
      </p>
      <p className="text-2xs leading-snug text-text-muted">{descricao}</p>
    </li>
  );
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5">
      <path
        d="M2.5 8a5.5 5.5 0 019.4-3.9M13.5 8a5.5 5.5 0 01-9.4 3.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 1.5v3h-3M4 14.5v-3h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
