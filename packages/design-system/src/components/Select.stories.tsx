import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Select } from "./Select";
import { POKEMON_TYPES, getTypeLabel } from "./TypeChip";
import { TypeIcon } from "./TypeIcon";
import { Stack } from "../primitives/Layout";

const TIPOS = [
  { value: "all", label: "Any type" },
  ...POKEMON_TYPES.map((t) => ({
    value: t,
    label: getTypeLabel(t),
    // O mesmo símbolo que a tela usa — não uma aproximação colorida.
    adornment: <TypeIcon type={t} size={16} />,
  })),
];

const meta = {
  title: "Componentes/Select",
  component: Select,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Seleção de opção única, sobre Radix Select.",
          "",
          "**Por que não um `<select>` nativo.** O nativo não aceita marcação",
          "dentro da opção, e este projeto precisa do símbolo de tipagem ao lado",
          "do nome — o mesmo símbolo das cartas físicas. Sem ele, a lista de",
          "dezoito tipos vira dezoito palavras parecidas.",
          "",
          "**O que veio do Radix, e por que não foi escrito à mão.** Foco preso",
          "enquanto aberto, foco devolvido ao gatilho ao fechar, navegação por",
          "setas, busca por digitação, `aria-activedescendant`, posicionamento que",
          "não sai da janela. Cada um desses é um bug conhecido de dropdown feito",
          "à mão. A aparência é toda nossa; o comportamento é de quem já",
          "resolveu.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
    hideLabel: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Learns attack of",
    options: TIPOS,
    defaultValue: "all",
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: (args) => (
    <div className="max-w-64">
      <Select {...args} />
    </div>
  ),
};

export const ComSimbolo: Story = {
  name: "Opção com símbolo",
  parameters: {
    docs: {
      description: {
        story: [
          "`adornment` aceita qualquer nó React. Aqui é o símbolo de tipagem do",
          "jogo de tabuleiro — identidade anterior ao design system, que o sistema",
          "acomoda em vez de substituir por um ícone genérico.",
          "",
          "O símbolo aparece **na lista, não no gatilho**. É consequência de onde",
          "ele fica: o `adornment` é irmão do `Select.ItemText`, e o gatilho do",
          "Radix reflete só o `ItemText`. A escolha é deliberada — dentro do",
          "`ItemText` o símbolo entraria no texto que a busca por digitação",
          "compara, e digitar “fire” deixaria de casar de forma confiável.",
          "",
          "O ganho está onde importa: dezoito tipos numa lista são dezoito",
          "palavras parecidas, e o símbolo é o que permite achar pelo desenho.",
        ].join("\n"),
      },
    },
  },
  render: (args) => {
    const [v, setV] = useState("fire");
    return (
      <div className="max-w-64">
        <Select {...args} value={v} onValueChange={setV} />
      </div>
    );
  },
};

export const Tamanhos: Story = {
  render: (args) => (
    <Stack gap={4} className="max-w-64">
      {(["sm", "md", "lg"] as const).map((s) => (
        <Select key={s} {...args} size={s} label={`size="${s}"`} />
      ))}
    </Stack>
  ),
};

export const ComDica: Story = {
  name: "Com dica",
  render: (args) => (
    <div className="max-w-64">
      <Select
        {...args}
        hint="Filters by the type of attack the Pokémon learns — not its own type."
      />
    </div>
  ),
};

export const Desabilitado: Story = {
  name: "Desabilitado",
  render: (args) => (
    <div className="max-w-64">
      <Select {...args} disabled />
    </div>
  ),
};
