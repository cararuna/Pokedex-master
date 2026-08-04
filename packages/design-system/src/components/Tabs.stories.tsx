import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from "./Tabs";
import { TypeChip } from "./TypeChip";
import { Inline, Stack } from "../primitives/Layout";

const meta = {
  title: "Componentes/Tabs",
  component: Tabs,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Alterna entre painéis irmãos, sobre Radix Tabs.",
          "",
          "**Sublinhado, não cápsula.** Aba em cápsula tem a mesma silhueta de um",
          "botão `soft` — mesma altura, mesmo raio, mesmo fundo. Numa tela que já",
          "tem botões, quem olha não distingue o que navega do que executa. O",
          "sublinhado resolve por eliminação: nenhum botão do sistema tem essa",
          "forma.",
          "",
          "**Aba não é filtro.** Se as opções podem valer ao mesmo tempo, ou se o",
          "estado precisa caber num link compartilhável, o componente certo é",
          "outro. Aba é uma escolha exclusiva sobre o mesmo assunto.",
          "",
          "Do Radix vêm as setas do teclado, o `roving tabindex` e a associação",
          "`aria-controls` entre gatilho e painel.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: () => (
    <Tabs defaultValue="attacks">
      <Tabs.List>
        <Tabs.Trigger value="attacks">Attacks</Tabs.Trigger>
        <Tabs.Trigger value="innate">Innate abilities</Tabs.Trigger>
        <Tabs.Trigger value="type">Type abilities</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="attacks">
        <Stack gap={2}>
          <p className="text-sm text-text-muted">
            Heat Wave · 10 — Dragon Breath · 8 — Crunch · 8
          </p>
        </Stack>
      </Tabs.Content>

      <Tabs.Content value="innate">
        <p className="text-sm text-text-muted">Blaze · Solar Power</p>
      </Tabs.Content>

      <Tabs.Content value="type">
        <Inline gap={1}>
          <TypeChip type="fire" />
          <TypeChip type="flying" />
        </Inline>
      </Tabs.Content>
    </Tabs>
  ),
};

export const ComDesabilitada: Story = {
  name: "Com aba indisponível",
  parameters: {
    docs: {
      description: {
        story: [
          "Aba desabilitada continua no fluxo de leitura e some da tabulação: quem",
          "usa teclado não fica preso num destino que não abre, e quem enxerga",
          "continua sabendo que a seção existe.",
          "",
          "Vale o alerta: se a aba fica indisponível com frequência, o problema é",
          "a divisão, não o estado.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Tabs defaultValue="attacks">
      <Tabs.List>
        <Tabs.Trigger value="attacks">Attacks</Tabs.Trigger>
        <Tabs.Trigger value="innate">Innate abilities</Tabs.Trigger>
        <Tabs.Trigger value="evolution" disabled>
          Evolution
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="attacks">
        <p className="text-sm text-text-muted">Tackle · 8</p>
      </Tabs.Content>
      <Tabs.Content value="innate">
        <p className="text-sm text-text-muted">Overgrow</p>
      </Tabs.Content>
      <Tabs.Content value="evolution">
        <p className="text-sm text-text-muted">—</p>
      </Tabs.Content>
    </Tabs>
  ),
};
