import type { Meta, StoryObj } from "@storybook/react-vite";
import { Disclosure } from "./Disclosure";
import { Badge } from "./Badge";
import { Table } from "./Table";
import { Stack } from "../primitives/Layout";

const meta = {
  title: "Componentes/Disclosure",
  component: Disclosure,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Um resumo sempre visível que abre para o detalhe.",
          "",
          "**O problema que ele resolve.** O histórico de mudanças mostrava, por",
          "item, título, autor, tabela de diff, raciocínio do modelo e erro —",
          "cinco blocos por linha, sete linhas na tela. Nada se distinguia de",
          "nada, e a pessoa que só queria saber *o que aconteceu* tinha de ler",
          "tudo de todos.",
          "",
          "A regra que a API impõe: **resumo é obrigatório, detalhe é sob",
          "demanda.** Quem varre lê uma linha por item; quem parou num item abre.",
          "",
          "**Por que Radix Collapsible e não `<details>`.** O nativo resolve quase",
          "tudo e seria a escolha certa se a aparência não importasse. Mas ele não",
          "anima altura — `height: auto` não interpola —, o marcador é difícil de",
          "padronizar entre navegadores, e não dá controle sobre onde o",
          "`aria-expanded` vive. O Radix publica",
          "`--radix-collapsible-content-height`, que é o que permite animar até a",
          "altura real do conteúdo, e a aparência continua nossa.",
        ].join("\n"),
      },
    },
  },
  args: {
    summary: <p className="text-sm font-semibold">Rewrite the grass talent “Esporos Fortes”</p>,
    children: <p className="text-sm text-text-muted">O detalhe aparece aqui.</p>,
  },
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
};

export const ComSelo: Story = {
  name: "Com selo à direita",
  parameters: {
    docs: {
      description: {
        story: [
          "`aside` fica **fora** do gatilho, de propósito. Botão dentro de botão",
          "é HTML inválido, e um selo de status que parece clicável mas não faz",
          "nada engana — expandir pertence ao texto, não ao estado.",
        ].join("\n"),
      },
    },
  },
  args: {
    aside: (
      <Badge tone="success" dot>
        Applied
      </Badge>
    ),
  },
};

export const Lista: Story = {
  name: "Em lista — o caso real",
  parameters: {
    docs: {
      description: {
        story: [
          "Sete registros ricos ocupando sete linhas. É esta densidade que a tela",
          "de mudanças precisava: dá para varrer o histórico inteiro sem rolar,",
          "e abrir só o que interessa.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Stack gap={2}>
      {[
        { t: "Set charizard's fire attack value to 9", s: "Rolled back", tone: "warning" },
        { t: "Rewrite the grass talent “Esporos Fortes”", s: "Applied", tone: "success" },
        { t: "Charizard fire attack should be worth 8", s: "Not supported", tone: "neutral" },
        { t: "Set bulbasaur's poison attack value to 9", s: "Failed", tone: "danger" },
      ].map((r) => (
        <Disclosure
          key={r.t}
          summary={
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{r.t}</p>
              <p className="truncate text-xs text-text-subtle">“{r.t}” · Caio (mesa)</p>
            </div>
          }
          aside={
            <Badge tone={r.tone as "success"} dot>
              {r.s}
            </Badge>
          }
        >
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Field</Table.Head>
                <Table.Head>Before</Table.Head>
                <Table.Head>After</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell className="font-mono text-xs text-text-muted">game_power</Table.Cell>
                <Table.Cell className="text-text-muted line-through">10</Table.Cell>
                <Table.Cell className="font-medium">9</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table>
        </Disclosure>
      ))}
    </Stack>
  ),
  args: { ...meta.args },
};

export const JaAberto: Story = {
  name: "Já aberto",
  args: { defaultOpen: true },
};
