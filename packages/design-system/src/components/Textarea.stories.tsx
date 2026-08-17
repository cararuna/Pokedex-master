import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Textarea } from "./Textarea";
import { Stack } from "../primitives/Layout";

const meta = {
  title: "Componentes/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Texto de várias linhas. Nasceu para o compositor do inbox de",
          "mudanças, onde alguém descreve em linguagem natural o que quer",
          "corrigir no jogo.",
          "",
          "**Por que não um `<textarea>` solto na tela.** Foi a alternativa",
          "considerada e recusada: o campo precisa de rótulo associado, de",
          "`aria-invalid`, de `aria-describedby` apontando para a mensagem",
          "certa e de um contador que leitor de tela também alcance. Escrito na",
          "página, isso vira quatro decisões que a próxima tela vai refazer —",
          "provavelmente diferente.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    hideLabel: { control: "boolean" },
    disabled: { control: "boolean" },
    showCount: { control: "boolean" },
  },
  args: {
    label: "Describe the change",
    placeholder: "Charizard's fire attack should be worth 10",
    rows: 3,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlado(args: React.ComponentProps<typeof Textarea>) {
  const [v, setV] = useState(args.value ?? "");
  return (
    <div className="max-w-lg">
      <Textarea {...args} value={v} onChange={(e) => setV(e.target.value)} />
    </div>
  );
}

export const Padrao: Story = {
  name: "Padrão",
  render: (args) => <Controlado {...args} />,
};

export const ComDicaEContador: Story = {
  name: "Com dica e contador",
  parameters: {
    docs: {
      description: {
        story: [
          "O contador é `aria-live=\"polite\"`. Um contador só visual deixa quem",
          "usa leitor de tela descobrir o limite ao ser barrado no envio;",
          "`polite` anuncia sem interromper a digitação.",
          "",
          "`maxLength` não é a defesa real — o limite que vale é o do Zod na",
          "API. Este aqui é cortesia com quem digita.",
        ].join("\n"),
      },
    },
  },
  args: {
    hint: "Plain language. It becomes a proposal you review before anything is written.",
    maxLength: 120,
    showCount: true,
  },
  render: (args) => <Controlado {...args} />,
};

export const ComErro: Story = {
  name: "Com erro",
  parameters: {
    docs: {
      description: {
        story:
          "`error` marca `aria-invalid` e substitui a dica — borda vermelha sozinha é informação exclusivamente visual.",
      },
    },
  },
  args: {
    value: "Set Charizard's fire attack to 90",
    error: "90 is the video-game damage number. This game uses 8, 9 or 10.",
  },
  render: (args) => <Controlado {...args} />,
};

export const Estados: Story = {
  render: (args) => (
    <Stack gap={5} className="max-w-lg">
      <Textarea {...args} label="Normal" defaultValue="" />
      <Textarea {...args} label="Preenchido" defaultValue="Rename Bulbasaur's grass attack to solar-beam" />
      <Textarea {...args} label="Desabilitado" disabled defaultValue="Não editável" />
    </Stack>
  ),
};
