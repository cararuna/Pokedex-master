import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SearchField } from "./SearchField";
import { Button } from "./Button";
import { Inline, Stack } from "../primitives/Layout";

const meta = {
  title: "Componentes/SearchField",
  component: SearchField,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Campo de busca. A altura, o raio e o anel de foco vêm dos tokens",
          "`--control-*` — os mesmos do `Button` e do `Select`. É o que faz campo",
          "e botão alinharem lado a lado sem ninguém ter medido nada.",
          "",
          "**`label` é obrigatório.** Não há como instanciar este componente sem",
          "rótulo: o TypeScript recusa. `placeholder` não é rótulo — some quando",
          "a pessoa digita, não é lido de forma confiável por leitor de tela e",
          "desaparece justamente quando alguém volta ao campo para conferir o que",
          "estava preenchendo. Quando o desenho não comporta rótulo visível,",
          "`hideLabel` esconde na tela e mantém para a tecnologia assistiva.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
    hideLabel: { control: "boolean" },
    disabled: { control: "boolean" },
    hint: { control: "text" },
    error: { control: "text" },
  },
  args: {
    label: "Search Pokémon",
    placeholder: "Name or number",
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };

export const Tamanhos: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Os três tamanhos existem em `Button`, `Select` e aqui com a mesma altura resultante. Trocar `size` numa linha de filtros mantém tudo alinhado.",
      },
    },
  },
  render: (args) => (
    <Stack gap={4}>
      {(["sm", "md", "lg"] as const).map((s) => (
        <Inline key={s} gap={2} align="end">
          <SearchField {...args} size={s} label={`size="${s}"`} />
          <Button size={s}>Search</Button>
        </Inline>
      ))}
    </Stack>
  ),
};

export const ComEstado: Story = {
  name: "Com valor e limpar",
  parameters: {
    docs: {
      description: {
        story: [
          "O botão de limpar só aparece quando há texto — controle que não faz",
          "nada não deve ocupar espaço nem receber foco por tabulação.",
        ].join("\n"),
      },
    },
  },
  render: (args) => {
    const [valor, setValor] = useState("charizard");
    return (
      <SearchField
        {...args}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onClear={() => setValor("")}
      />
    );
  },
};

export const Auxiliar: Story = {
  name: "Dica e erro",
  parameters: {
    docs: {
      description: {
        story: [
          "`hint` e `error` ocupam a mesma linha, e o erro substitui a dica em vez",
          "de empilhar — assim o campo não muda de altura ao falhar, e a linha de",
          "filtros não pula.",
          "",
          "O erro é ligado ao campo por `aria-describedby` e o campo ganha",
          "`aria-invalid`: quem usa leitor de tela ouve a mensagem ao chegar no",
          "campo, e não só quem enxerga o texto vermelho.",
        ].join("\n"),
      },
    },
  },
  render: (args) => (
    <Stack gap={5}>
      <SearchField {...args} hint="Accepts partial names: “char”." />
      <SearchField {...args} value="?!" error="Use letters or numbers only." />
    </Stack>
  ),
};

export const SemRotuloVisivel: Story = {
  name: "Rótulo oculto",
  parameters: {
    docs: {
      description: {
        story:
          "`hideLabel` remove o rótulo da tela e o mantém no DOM para tecnologia assistiva. É o caso de uma barra de ferramentas onde o contexto já é evidente para quem enxerga — nunca uma licença para omitir o rótulo.",
      },
    },
  },
  args: { hideLabel: true },
};
