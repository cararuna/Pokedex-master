import type { Meta, StoryObj } from "@storybook/react-vite";
import { Drawer } from "./Drawer";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Markdown } from "./Markdown";
import { Inline, Stack } from "../primitives/Layout";

const RESPOSTA = `
Pokémon that learn a **fire** attack with value **10**:

| Pokémon | Attack | Types |
| --- | --- | --- |
| Charmander | Flare Blitz | fire |
| Charizard | Heat Wave | fire/flying |
| Magmar | Fire Blast | fire |

There are **30** in total — these are the first three by number.
`.trim();

const meta = {
  title: "Componentes/Drawer",
  component: Drawer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: [
          "Painel lateral, sobre Radix Dialog — a mesma máquina do `Dialog`, com",
          "outra posição e outra intenção.",
          "",
          "**Quando é gaveta e não janela.** O `Dialog` interrompe: a decisão",
          "precisa acontecer antes de qualquer outra coisa. A gaveta acompanha —",
          "o conteúdo da tela continua sendo o assunto, e o painel é auxiliar. O",
          "assistente do jogo é exatamente esse caso: quem pergunta está olhando",
          "as cartas e quer continuar olhando.",
          "",
          "Herda do Radix o mesmo conjunto do `Dialog`: foco preso, foco devolvido",
          "ao gatilho, `Esc`, rolagem do fundo travada.",
          "",
          "**`Drawer.Body` rola; cabeçalho e rodapé não.** É o que mantém o campo",
          "de pergunta sempre visível numa conversa longa — sem isso, quem rolou",
          "para ler a resposta precisa rolar de volta para escrever.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: () => (
    <Drawer>
      <Drawer.Trigger asChild>
        <Button variant="soft">Ask</Button>
      </Drawer.Trigger>
      <Drawer.Content aria-describedby={undefined}>
        <Drawer.Header>
          <Stack gap={0}>
            <Drawer.Title>Table assistant</Drawer.Title>
            <span className="text-2xs text-text-subtle">
              Connected · google/gemini-2.5-flash
            </span>
          </Stack>
          <Drawer.Close asChild>
            <Button variant="ghost" size="sm">
              Close
            </Button>
          </Drawer.Close>
        </Drawer.Header>

        <Drawer.Body className="px-4 py-4">
          <Stack gap={3}>
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-[var(--r-md)] bg-accent-soft px-3 py-2 text-sm text-accent-text">
                Who learns a fire attack with value 10?
              </div>
            </div>

            <Inline gap={1}>
              <Badge tone="neutral" size="sm">
                Searching Pokémon
              </Badge>
            </Inline>

            <Markdown>{RESPOSTA}</Markdown>

            <p className="font-mono text-2xs text-text-subtle">
              1 step · 7,837 tokens · US$ 0.02115
            </p>
          </Stack>
        </Drawer.Body>

        <Drawer.Footer>
          <div className="flex w-full items-end gap-2">
            <textarea
              rows={2}
              placeholder="Who learns an ice attack?"
              className="min-h-[2.5rem] flex-1 resize-none rounded-[var(--field-radius)] border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2 text-sm text-text"
            />
            <Button>Send</Button>
          </div>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};

export const ConteudoLongo: Story = {
  name: "Corpo com rolagem",
  parameters: {
    docs: {
      description: {
        story:
          "Só o corpo rola. Role a lista e repare que o cabeçalho e o rodapé ficam onde estão — é o que garante que a saída e o campo de envio nunca saiam de alcance.",
      },
    },
  },
  render: () => (
    <Drawer>
      <Drawer.Trigger asChild>
        <Button variant="soft">Open long list</Button>
      </Drawer.Trigger>
      <Drawer.Content aria-describedby={undefined}>
        <Drawer.Header>
          <Drawer.Title>Fire attacks</Drawer.Title>
          <Drawer.Close asChild>
            <Button variant="ghost" size="sm">
              Close
            </Button>
          </Drawer.Close>
        </Drawer.Header>
        <Drawer.Body className="px-4 py-4">
          <Stack gap={2}>
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className="rounded-[var(--r-sm)] bg-surface-sunken px-3 py-2 text-sm text-text"
              >
                Pokémon #{String(i + 1).padStart(3, "0")} — Fire Blast · 10
              </div>
            ))}
          </Stack>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="ghost">Close</Button>
          </Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};
