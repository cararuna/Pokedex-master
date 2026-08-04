import type { Meta, StoryObj } from "@storybook/react-vite";
import { TooltipProvider } from "@pokedex/design-system";
import { GameCard } from "./GameCard";
import type { GamePokemon } from "../../game/rules";

/**
 * Esta story monta o **componente de produção**, importado do mesmo caminho
 * que a tela usa. Não há reconstrução aproximada aqui: se a carta mudar, esta
 * página muda junto.
 *
 * O verso busca na API quando a carta gira. Como o Storybook roda sem backend,
 * o decorador abaixo intercepta `fetch` e devolve a ficha real do Charizard —
 * a mesma forma que a API entrega, com os campos `attacks`,
 * `innate_abilities` e `type_abilities`.
 */

const CHARIZARD: GamePokemon = {
  id: 6,
  dexNumber: 6,
  slug: "charizard",
  types: ["fire", "flying"],
  abilities: [],
  sprites: {
    "generation-iii":
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/6.png",
    artwork:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
    default:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
  },
  moves: [
    { attackName: "heat-wave", moveType: "fire", power: 10 },
    { attackName: "dragon-breath", moveType: "dragon", power: 8 },
    { attackName: "crunch", moveType: "dark", power: 8 },
    { attackName: "wing-attack", moveType: "flying", power: 8 },
    { attackName: "shadow-claw", moveType: "ghost", power: 8 },
    { attackName: "scratch", moveType: "normal", power: 8 },
    { attackName: "metal-claw", moveType: "steel", power: 8 },
  ],
};

const BULBASAUR: GamePokemon = {
  id: 1,
  dexNumber: 1,
  slug: "bulbasaur",
  types: ["grass", "poison"],
  abilities: [],
  sprites: {
    "generation-iii":
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/1.png",
    artwork:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
    default:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
  },
  moves: [
    { attackName: "solar-beam", moveType: "grass", power: 10 },
    { attackName: "double-edge", moveType: "normal", power: 10 },
  ],
};

const METAPOD: GamePokemon = {
  id: 11,
  dexNumber: 11,
  slug: "metapod",
  types: ["bug"],
  abilities: [],
  sprites: {
    "generation-iii":
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/emerald/11.png",
    default:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/11.png",
  },
  moves: [],
};

/** Fichas que o decorador devolve no lugar da API. */
const FICHAS: Record<string, unknown> = {
  charizard: {
    id: 6,
    slug: "charizard",
    dex_number: 6,
    types: ["fire", "flying"],
    sprites: CHARIZARD.sprites,
    attacks: [],
    innate_abilities: [
      { name: "Blaze", description: "+1 em ataques Fire" },
      {
        name: "Poder Solar",
        description: "+1 em todos ataques se dia ensolarado estiver ativo",
      },
    ],
    type_abilities: [
      { type: "fire", name: "Chama Interna", description: "Burn dura 1 rodada a mais", position: 1 },
      { type: "fire", name: "Calor Seco", description: "Imune a Freeze", position: 2 },
      { type: "fire", name: "Explosão", description: "Ataque de área com -1", position: 3 },
      { type: "flying", name: "Corrente de Ar", description: "Move um inimigo 1 casa", position: 1 },
      { type: "flying", name: "Voo Rasante", description: "Ignora terreno difícil", position: 2 },
      { type: "flying", name: "Olho de Águia", description: "+1 em ataques à distância", position: 3 },
    ],
  },
  bulbasaur: {
    id: 1,
    slug: "bulbasaur",
    dex_number: 1,
    types: ["grass", "poison"],
    sprites: BULBASAUR.sprites,
    attacks: [],
    innate_abilities: [
      { name: "Overgrow", description: "+1 em ataques Grass" },
      { name: "Esporos Tóxicos", description: "Poison aplica 2 stacks" },
      { name: "Resiliência Natural", description: "Reduz penalidade de status" },
    ],
    type_abilities: [
      { type: "grass", name: "Feixe Solar", description: "+1 em ataques do tipo Grass", position: 1 },
      {
        type: "grass",
        name: "Semente de sanguessuga",
        description:
          "Sempre que infligir ou receber qualquer status, remova o status de um Pokémon da sua equipe",
        position: 2,
      },
      { type: "grass", name: "Esporos Fortes", description: "Rolagem de Sono com vantagem", position: 3 },
      { type: "poison", name: "Badly Poison", description: "Aplica poison dobrado com 2 tokens", position: 1 },
      { type: "poison", name: "Aura Corrosiva", description: "Reduz defesa do inimigo em -1", position: 2 },
      { type: "poison", name: "Peçonha Persistente", description: "Espalha poison para outro alvo", position: 3 },
    ],
  },
};

/** Intercepta só `/pokemon/:slug`; qualquer outra chamada segue para a rede. */
function comApiSimulada(Story: () => React.ReactElement) {
  const original = window.fetch;
  window.fetch = async (entrada, init) => {
    const url = String(entrada instanceof Request ? entrada.url : entrada);
    const m = /\/pokemon\/([a-z-]+)$/.exec(url);
    if (m && FICHAS[m[1]]) {
      return new Response(JSON.stringify(FICHAS[m[1]]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return original(entrada, init);
  };
  return (
    <TooltipProvider delayDuration={200}>
      <Story />
    </TooltipProvider>
  );
}

const meta = {
  title: "Produto/GameCard",
  component: GameCard,
  decorators: [comApiSimulada],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "A carta de consulta do jogo de tabuleiro — o componente de produção,",
          "importado do mesmo caminho que a tela usa.",
          "",
          "**Não é um cartão de Pokédex.** A informação central são os golpes já",
          "convertidos para a escala do jogo (8, 9 ou 10), um por tipo, com as",
          "vantagens de cada um. O filtro por tipo de ataque é a pergunta que a",
          "tela existe para responder.",
          "",
          "### O que veio das cartas físicas",
          "",
          "Os **símbolos de tipagem** são as mesmas imagens do jogo. São",
          "identidade anterior ao design system, que os acomoda em vez de",
          "substituir por um ícone genérico — o `TypeIcon` mora no pacote",
          "justamente para que a vitrine consiga mostrá-los.",
          "",
          "### O que mudou no redesenho",
          "",
          "A cor do tipo deixou de inundar o cartão atrás de uma borda de 24px e",
          "virou pigmento: fio de cor no topo, halo atrás da arte, tinta nos",
          "símbolos. O papel é o mesmo do resto do sistema, então trinta cartas",
          "lado a lado leem como catálogo, e não como trinta retângulos brigando.",
          "",
          "### Dois detalhes que valem reparar",
          "",
          "**Altura fixa.** `--game-card-height` fica no elemento externo, e as",
          "duas faces são absolutas. Se a frente fosse `relative`, ela ditaria a",
          "altura e cartas com mais ataques ficariam mais altas que as vizinhas.",
          "",
          "**`inert` na face escondida.** Sem ele o Tab continua entrando nos",
          "botões do verso enquanto a frente está visível, e o foco desaparece",
          "para um lugar que não existe na tela.",
        ].join("\n"),
      },
    },
  },
  args: { spriteKey: "generation-iii" },
} satisfies Meta<typeof GameCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Frente: Story = {
  name: "A carta",
  parameters: {
    docs: {
      description: {
        story:
          "Clique em **Abilities** para girar. O verso busca na API — aqui, simulada pelo decorador — e mostra as habilidades inatas primeiro, porque são o que o Pokémon já tem; as de tipo são potencial.",
      },
    },
  },
  args: { pokemon: CHARIZARD },
  render: (args) => (
    <div className="max-w-[19rem]">
      <GameCard {...args} />
    </div>
  ),
};

export const ComDestaque: Story = {
  name: "Com filtro de tipo ativo",
  parameters: {
    docs: {
      description: {
        story: [
          "Quando o jogador filtra por um tipo de ataque, o golpe correspondente",
          "recebe realce. É a razão de existir da tela: a resposta procurada não",
          "pode exigir varredura visual da lista inteira.",
        ].join("\n"),
      },
    },
  },
  args: { pokemon: CHARIZARD, highlightMoveType: "fire" },
  render: (args) => (
    <div className="max-w-[19rem]">
      <GameCard {...args} />
    </div>
  ),
};

export const NaGrade: Story = {
  name: "Na grade, com altura igual",
  parameters: {
    docs: {
      description: {
        story: [
          "Três cartas com quantidades muito diferentes de golpes — sete, dois e",
          "nenhum. **A altura é a mesma nas três**, e continua a mesma depois do",
          "giro. Foi um defeito real: com a frente em `relative`, a carta do",
          "Charizard ficava mais alta que a do Metapod e a grade serrilhava.",
        ].join("\n"),
      },
    },
  },
  args: { pokemon: CHARIZARD },
  render: (args) => (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(17rem,1fr))]">
      <GameCard {...args} pokemon={CHARIZARD} />
      <GameCard {...args} pokemon={BULBASAUR} />
      <GameCard {...args} pokemon={METAPOD} />
    </div>
  ),
};
