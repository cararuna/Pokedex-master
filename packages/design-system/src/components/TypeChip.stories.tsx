import type { Meta, StoryObj } from "@storybook/react-vite";
import { TypeChip, POKEMON_TYPES } from "./TypeChip";
import { Inline, Stack } from "../primitives/Layout";

const meta = {
  title: "Componentes/TypeChip",
  component: TypeChip,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Identifica o tipo elemental de um Pokémon ou golpe.",
          "",
          "### O que ele substituiu",
          "",
          "No projeto antigo, cada tipo tinha um bloco de CSS próprio:",
          "",
          "```css",
          "/* Tipo Fogo */",
          ".fire {",
          "  border: 24px solid #fed400;",
          "  background-color: #eb1c34;",
          "  box-shadow: 2px 5px #fed400;",
          "}",
          "```",
          "",
          "Dezoito blocos quase idênticos, cerca de 600 linhas, com a cor inundando",
          "o cartão inteiro. Acrescentar um tipo significava escrever mais um bloco.",
          "",
          "### Como funciona agora",
          "",
          "O tipo entra como **dado**, não como classe. O componente escreve uma",
          "custom property local (`--type`) e todo o estilo referencia ela — o mesmo",
          "CSS serve aos 18 tipos. Acrescentar um tipo é uma linha de token.",
          "",
          "A variante suave sai de `color-mix` sobre a mesma cor base, então são",
          "**18 tokens em vez de 36**.",
          "",
          "### Por que `soft` é o padrão",
          "",
          "Numa grade de 300 cartões com dois tipos cada, chip sólido vira ruído e o",
          "olho perde o nome do Pokémon, que é a informação principal. Pigmento sobre",
          "papel, não bloco chapado.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    type: { control: "select", options: POKEMON_TYPES },
    variant: { control: "radio", options: ["soft", "solid", "outline"] },
    size: { control: "radio", options: ["sm", "md"] },
    iconOnly: { control: "boolean" },
  },
  args: { type: "fire", variant: "soft", size: "md" },
} satisfies Meta<typeof TypeChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };

export const TodosOsTipos: Story = {
  name: "Os 18 tipos",
  parameters: {
    docs: {
      description: {
        story: [
          "Todas as matizes foram calibradas no mesmo intervalo de luminância, para",
          "que nenhum tipo grite mais alto que outro numa grade e para que texto",
          "branco passe 4.5:1 sobre qualquer uma delas.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Inline gap={2}>
      {POKEMON_TYPES.map((t) => (
        <TypeChip key={t} type={t} />
      ))}
    </Inline>
  ),
};

export const Variantes: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          "`soft` — padrão, para grade e listagem.  ",
          "`solid` — quando o tipo é a informação principal da tela.  ",
          "`outline` — sobre superfície já muito colorida.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      {(["soft", "solid", "outline"] as const).map((v) => (
        <Stack key={v} gap={2}>
          <p className="font-mono text-xs uppercase tracking-wider text-text-subtle">
            {v}
          </p>
          <Inline gap={2}>
            {(["fire", "water", "grass", "electric", "psychic", "dragon"] as const).map(
              (t) => (
                <TypeChip key={t} type={t} variant={v} />
              ),
            )}
          </Inline>
        </Stack>
      ))}
    </Stack>
  ),
};

export const SomenteIcone: Story = {
  name: "Somente ícone",
  parameters: {
    docs: {
      description: {
        story: [
          "Sem texto visível, o nome do tipo vai para `aria-label` — a informação",
          "continua existindo para leitor de tela. Um ponto de cor sozinho não",
          "comunica nada a quem não enxerga a cor.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Inline gap={2}>
      {POKEMON_TYPES.slice(0, 9).map((t) => (
        <TypeChip key={t} type={t} iconOnly />
      ))}
    </Inline>
  ),
};

export const NoContexto: Story = {
  name: "No contexto",
  render: () => (
    <div className="max-w-xs rounded-[var(--card-radius)] border border-border bg-surface-raised p-5">
      <Stack gap={3}>
        <span className="font-mono text-xs text-text-subtle">N.º 006</span>
        <p className="font-display text-lg font-semibold">Charizard</p>
        <Inline gap={1.5 as never}>
          <TypeChip type="fire" size="sm" />
          <TypeChip type="flying" size="sm" />
        </Inline>
      </Stack>
    </div>
  ),
};
