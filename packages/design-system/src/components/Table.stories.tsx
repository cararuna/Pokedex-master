import type { Meta, StoryObj } from "@storybook/react-vite";
import { Table } from "./Table";
import { TypeChip } from "./TypeChip";
import { Badge } from "./Badge";

const LINHAS = [
  { n: "006", nome: "Charizard", ataque: "Heat Wave", tipo: "fire", valor: 10 },
  { n: "003", nome: "Venusaur", ataque: "Solar Beam", tipo: "grass", valor: 10 },
  { n: "009", nome: "Blastoise", ataque: "Hydro Pump", tipo: "water", valor: 10 },
  { n: "012", nome: "Butterfree", ataque: "Bug Buzz", tipo: "bug", valor: 9 },
  { n: "025", nome: "Pikachu", ataque: "Thunderbolt", tipo: "electric", valor: 9 },
] as const;

const meta = {
  title: "Componentes/Table",
  component: Table,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Tabela de dados, composta por partes que espelham o HTML —",
          "`Table.Header`, `Table.Row`, `Table.Head`, `Table.Cell`. A saída é",
          "`<table>` de verdade, com `<th>` no cabeçalho: leitor de tela anuncia",
          "a coluna ao entrar em cada célula, o que uma grade de `<div>` não faz.",
          "",
          "**A rolagem horizontal é do contêiner, não da página.** A tabela vive",
          "num embrulho com `overflow-x: auto` e `tabindex=0` — sem o `tabindex`,",
          "quem navega por teclado não consegue rolar a região, e as colunas da",
          "direita ficam inalcançáveis numa tela estreita.",
          "",
          "**Números em `tabular-nums`.** Sem isso os dígitos têm larguras",
          "diferentes e a coluna de valores serrilha de linha para linha — o olho",
          "perde a comparação vertical, que é a razão de existir da tabela.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: () => (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.Head>No.</Table.Head>
          <Table.Head>Pokémon</Table.Head>
          <Table.Head>Attack</Table.Head>
          <Table.Head>Type</Table.Head>
          <Table.Head className="text-right">Value</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {LINHAS.map((l) => (
          <Table.Row key={l.n}>
            <Table.Cell className="font-mono text-xs tabular-nums text-text-subtle">
              {l.n}
            </Table.Cell>
            <Table.Cell className="font-medium">{l.nome}</Table.Cell>
            <Table.Cell>{l.ataque}</Table.Cell>
            <Table.Cell>
              <TypeChip type={l.tipo} />
            </Table.Cell>
            <Table.Cell className="text-right font-mono tabular-nums">
              {l.valor}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

export const ComLegenda: Story = {
  name: "Com legenda",
  parameters: {
    docs: {
      description: {
        story: [
          "`Table.Caption` vira `<caption>`, que é lido antes do conteúdo e",
          "descreve a tabela inteira. Um parágrafo acima da tabela parece igual e",
          "não tem essa ligação.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Table>
      <Table.Caption>
        Strongest attack of each Pokémon, converted to the board game scale.
      </Table.Caption>
      <Table.Header>
        <Table.Row>
          <Table.Head>Pokémon</Table.Head>
          <Table.Head>Attack</Table.Head>
          <Table.Head className="text-right">Value</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {LINHAS.slice(0, 3).map((l) => (
          <Table.Row key={l.n}>
            <Table.Cell className="font-medium">{l.nome}</Table.Cell>
            <Table.Cell>{l.ataque}</Table.Cell>
            <Table.Cell className="text-right font-mono tabular-nums">
              <Badge tone={l.valor === 10 ? "accent" : "neutral"}>{l.valor}</Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

export const Estreita: Story = {
  name: "Rolagem horizontal",
  parameters: {
    docs: {
      description: {
        story:
          "Reduza a largura da janela até as colunas não caberem: a rolagem acontece dentro do embrulho, e a página não ganha barra horizontal. Clique na tabela e use as setas — a região recebe foco de propósito.",
      },
    },
  },
  render: () => (
    <div className="max-w-md">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Pokémon</Table.Head>
            <Table.Head>Attack</Table.Head>
            <Table.Head>Type</Table.Head>
            <Table.Head>Strong against</Table.Head>
            <Table.Head className="text-right">Value</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {LINHAS.map((l) => (
            <Table.Row key={l.n}>
              <Table.Cell className="font-medium">{l.nome}</Table.Cell>
              <Table.Cell>{l.ataque}</Table.Cell>
              <Table.Cell>
                <TypeChip type={l.tipo} />
              </Table.Cell>
              <Table.Cell className="whitespace-nowrap text-text-muted">
                grass, bug, ice, steel
              </Table.Cell>
              <Table.Cell className="text-right font-mono tabular-nums">
                {l.valor}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  ),
};
