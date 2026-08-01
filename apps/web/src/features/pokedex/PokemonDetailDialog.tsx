import { useEffect, useState } from "react";
import {
  Badge,
  Dialog,
  Inline,
  Skeleton,
  Stack,
  StatBar,
  Table,
  Tabs,
  TypeChip,
  type PokemonType,
} from "@pokedex/design-system";
import {
  fetchMoves,
  type PokemonDetail,
  type PokemonMove,
} from "../../lib/pokeapi";

/**
 * Ficha completa, em diálogo.
 *
 * Substitui o flip 3D do cartão antigo, que escondia a frente ao virar, não
 * tinha estado navegável e era invisível para leitor de tela — quem não via a
 * animação não sabia que existia um verso.
 *
 * Os golpes carregam **só quando a aba é aberta**. É o dado caro (uma
 * requisição por golpe) e não faz sentido pagá-lo por quem só quer ver os
 * atributos. Na Fase 2 vira junção no banco e o carregamento some.
 */

interface Props {
  pokemon: PokemonDetail | null;
  onClose: () => void;
}

export function PokemonDetailDialog({ pokemon, onClose }: Props) {
  return (
    <Dialog open={pokemon !== null} onOpenChange={(open) => !open && onClose()}>
      {pokemon && (
        <Dialog.Content className="max-w-2xl">
          <Dialog.Header>
            <span className="font-mono text-xs tabular-nums text-text-subtle">
              N.º {String(pokemon.id).padStart(4, "0")}
            </span>
            <Dialog.Title>{pokemon.name}</Dialog.Title>
            <Dialog.Description className="sr-only">
              Ficha de {pokemon.name}: atributos, características e golpes.
            </Dialog.Description>
            <Inline gap={1.5 as never} className="pt-1">
              {pokemon.types.map((t) => (
                <TypeChip key={t} type={t as PokemonType} size="sm" />
              ))}
            </Inline>
          </Dialog.Header>

          <div className="grid gap-6 sm:grid-cols-[11rem_1fr]">
            <div className="relative grid aspect-square place-items-center rounded-[var(--r-lg)] bg-surface-sunken">
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-[var(--r-lg)] opacity-20"
                style={{
                  background: `radial-gradient(circle at 50% 55%, var(--color-type-${pokemon.types[0]}) 0%, transparent 70%)`,
                }}
              />
              {pokemon.sprite && (
                <img
                  src={pokemon.sprite}
                  alt={`Ilustração de ${pokemon.name}`}
                  className="relative size-36 object-contain"
                />
              )}
            </div>

            <Tabs defaultValue="stats">
              <Tabs.List>
                <Tabs.Trigger value="stats">Atributos</Tabs.Trigger>
                <Tabs.Trigger value="about">Ficha</Tabs.Trigger>
                <Tabs.Trigger value="moves">Golpes</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="stats">
                <Stack gap={2}>
                  {pokemon.stats.map((stat) => (
                    <StatBar
                      key={stat.label}
                      label={stat.label}
                      value={stat.value}
                      color={`var(--color-type-${pokemon.types[0]})`}
                    />
                  ))}
                </Stack>
              </Tabs.Content>

              <Tabs.Content value="about">
                <Stack gap={4}>
                  <dl className="grid grid-cols-2 gap-4">
                    <Dado rotulo="Altura" valor={`${(pokemon.height / 10).toFixed(1)} m`} />
                    <Dado rotulo="Peso" valor={`${(pokemon.weight / 10).toFixed(1)} kg`} />
                  </dl>
                  <Stack gap={2}>
                    <p className="text-2xs uppercase tracking-wider text-text-subtle">
                      Habilidades
                    </p>
                    <Inline gap={1.5 as never}>
                      {pokemon.abilities.map((a) => (
                        <Badge key={a} tone="neutral">
                          {a}
                        </Badge>
                      ))}
                    </Inline>
                  </Stack>
                </Stack>
              </Tabs.Content>

              <Tabs.Content value="moves">
                <MovesTab slug={pokemon.slug} />
              </Tabs.Content>
            </Tabs>
          </div>
        </Dialog.Content>
      )}
    </Dialog>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-2xs uppercase tracking-wider text-text-subtle">{rotulo}</dt>
      <dd className="font-mono text-sm tabular-nums text-text">{valor}</dd>
    </div>
  );
}

/** Carrega os golpes na primeira vez que a aba é montada. */
function MovesTab({ slug }: { slug: string }) {
  const [moves, setMoves] = useState<PokemonMove[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setMoves(null);
    setErro(null);

    fetchMoves(slug)
      .then((m) => ativo && setMoves(m))
      .catch(() => ativo && setErro("Não foi possível carregar os golpes."));

    // Evita atualizar estado de um componente já desmontado quando a pessoa
    // fecha o diálogo antes da resposta chegar.
    return () => {
      ativo = false;
    };
  }, [slug]);

  if (erro) {
    return <p className="py-4 text-sm text-danger-text">{erro}</p>;
  }

  if (!moves) {
    return (
      <Stack gap={2} aria-busy="true" aria-label="Carregando golpes">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} height={32} />
        ))}
      </Stack>
    );
  }

  if (moves.length === 0) {
    return (
      <p className="py-4 text-sm text-text-muted">
        Nenhum golpe aprendido por nível.
      </p>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>Golpe</Table.Head>
          <Table.Head>Tipo</Table.Head>
          <Table.Head>Poder</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {moves.map((move) => (
          <Table.Row key={move.name}>
            <Table.Cell className="font-medium">{move.name}</Table.Cell>
            <Table.Cell>
              <TypeChip type={move.type as PokemonType} size="sm" />
            </Table.Cell>
            <Table.Cell className="font-mono tabular-nums text-text-muted">
              {move.power ?? "—"}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
