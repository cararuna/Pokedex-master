import { Card, Inline, TypeChip, type PokemonType } from "@pokedex/design-system";
import type { PokemonDetail } from "../../lib/pokeapi";

/**
 * Cartão de espécime.
 *
 * O cartão anterior tinha `min-height: 800px`, borda de 24px na cor do tipo,
 * fundo chapado e a lista inteira de golpes na frente — cada item da grade
 * ocupava uma tela e a cor gritava mais alto que o nome.
 *
 * Aqui a hierarquia é: número (discreto, mono) → ilustração → nome (serifada)
 * → tipos (chips pequenos). A cor do tipo aparece como pigmento contido, e o
 * detalhe pesado fica atrás de um clique.
 */

interface Props {
  pokemon: PokemonDetail;
  onSelect: (pokemon: PokemonDetail) => void;
}

export function PokemonCard({ pokemon, onSelect }: Props) {
  return (
    <Card elevation="interactive" className="group overflow-hidden">
      <Card.Media className="relative aspect-[4/3] grid place-items-center">
        {/* Halo suave na cor do tipo principal. Fica atrás da ilustração e
            some nas bordas — dá identidade cromática sem inundar o cartão,
            que era o problema do desenho antigo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.13] transition-opacity duration-[280ms] ease-out group-hover:opacity-25"
          style={{
            background: `radial-gradient(circle at 50% 55%, var(--color-type-${pokemon.types[0]}) 0%, transparent 68%)`,
          }}
        />
        {pokemon.sprite ? (
          <img
            src={pokemon.sprite}
            alt=""
            loading="lazy"
            className="relative size-36 object-contain transition-transform duration-[280ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="relative grid size-36 place-items-center text-text-subtle">
            <span className="text-xs">sem imagem</span>
          </div>
        )}

        <span className="absolute left-3 top-3 font-mono text-2xs tabular-nums text-text-subtle">
          N.º {String(pokemon.id).padStart(4, "0")}
        </span>
      </Card.Media>

      <Card.Header className="gap-2.5">
        {/*
          O <button> cobre o cartão inteiro com ::after, em vez de o cartão ser
          um div com onClick. Assim o alvo clicável é um botão de verdade:
          recebe foco, responde a Enter e é anunciado como acionável. O Card
          reage com focus-within, então o anel aparece em volta do cartão todo.
        */}
        <Card.Title>
          <button
            type="button"
            onClick={() => onSelect(pokemon)}
            className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {pokemon.name}
          </button>
        </Card.Title>

        <Inline gap={1}>
          {pokemon.types.map((type) => (
            <TypeChip key={type} type={type as PokemonType} size="sm" />
          ))}
        </Inline>
      </Card.Header>
    </Card>
  );
}

/** Placeholder com a mesma forma do cartão — a grade não desloca ao carregar. */
export function PokemonCardSkeleton() {
  return (
    <Card>
      <Card.Media className="aspect-[4/3] animate-pulse bg-surface-sunken" />
      <Card.Header className="gap-2.5">
        <div className="h-6 w-2/3 animate-pulse rounded-[var(--r-xs)] bg-surface-sunken" />
        <div className="flex gap-1">
          <div className="h-5 w-16 animate-pulse rounded-[var(--r-xs)] bg-surface-sunken" />
          <div className="h-5 w-16 animate-pulse rounded-[var(--r-xs)] bg-surface-sunken" />
        </div>
      </Card.Header>
    </Card>
  );
}
