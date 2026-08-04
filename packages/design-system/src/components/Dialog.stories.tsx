import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { SearchField } from "./SearchField";
import { Stack } from "../primitives/Layout";

const meta = {
  title: "Componentes/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "Janela modal, sobre Radix Dialog.",
          "",
          "**O que a biblioteca resolve, e por que não foi escrito à mão.** Foco",
          "preso dentro da janela, foco devolvido ao gatilho ao fechar, `inert` no",
          "resto da página, `Esc` para sair, rolagem do fundo travada,",
          "`aria-modal` e a associação entre título, descrição e a janela. Cada um",
          "desses é um item conhecido de checklist de acessibilidade — e",
          "implementá-los à mão é um mês de bugs sutis, não uma tarde.",
          "",
          "A aparência é toda do sistema: superfície, raio, sombra e o véu saem",
          "dos tokens `--overlay-*`.",
          "",
          "**Modal interrompe.** Use quando a decisão precisa acontecer antes de",
          "qualquer outra coisa. Para conteúdo que acompanha a tela em vez de",
          "bloqueá-la, o componente é o `Drawer`.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button>Add Pokémon</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Add to the party</Dialog.Title>
          <Dialog.Description>
            Search by name or number. The card is added with the attacks already
            converted to the game scale.
          </Dialog.Description>
        </Dialog.Header>

        <Stack gap={4} className="px-5 py-4">
          <SearchField label="Search Pokémon" placeholder="Name or number" />
        </Stack>

        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="ghost">Cancel</Button>
          </Dialog.Close>
          <Button>Add</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};

export const Destrutivo: Story = {
  name: "Confirmação destrutiva",
  parameters: {
    docs: {
      description: {
        story: [
          "Duas coisas mudam, e nenhuma é a cor.",
          "",
          "A ação destrutiva usa `variant=\"danger\"` — cor própria, e não a",
          "`solid` pintada de vermelho, para que continue distinguível de uma",
          "ação principal comum.",
          "",
          "E o **cancelar vem primeiro na ordem de leitura e de tabulação**. Quem",
          "chegou aqui por engano encontra a saída antes de encontrar a",
          "consequência.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Dialog>
      <Dialog.Trigger asChild>
        <Button variant="outline">Remove card</Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Remove Charizard?</Dialog.Title>
          <Dialog.Description>
            The card leaves the party. This cannot be undone during the match.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Dialog.Close asChild>
            <Button variant="ghost">Cancel</Button>
          </Dialog.Close>
          <Button variant="danger">Remove</Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};
