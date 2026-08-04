import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { TypeChip } from "./TypeChip";
import { CardGrid, Inline, Stack } from "../primitives/Layout";

const meta = {
  title: "Componentes/Card",
  component: Card,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Superfície que agrupa conteúdo relacionado. Composto por partes —",
          "`Card.Header`, `Card.Body`, `Card.Footer` — e não por props como",
          "`title` e `footer`.",
          "",
          "A diferença decide o futuro da API. Com props, todo caso novo vira uma",
          "prop nova: `titleIcon`, `titleBadge`, `headerAction`, `footerAlign`. Em",
          "pouco tempo são vinte props e nenhuma flexibilidade — e a vigésima",
          "primeira ainda não atende. Com composição, quem consome monta o que",
          "precisa e a superfície pública não cresce.",
          "",
          "**A elevação troca de mecanismo entre os temas.** No claro a separação",
          "vem da sombra; no escuro, da borda — sombra não produz contraste sobre",
          "fundo quase preto. Os tokens `--card-*` já fazem essa troca, e o",
          "componente não sabe em qual tema está.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    elevation: {
      control: "radio",
      options: ["flat", "raised", "interactive"],
      description: "Como o cartão se separa do fundo",
    },
    compact: { control: "boolean", description: "Reduz o respiro interno" },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {
  name: "Padrão",
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <Card.Header>
        <Card.Title>Charizard</Card.Title>
        <Card.Description>No. 006 · Fire / Flying</Card.Description>
      </Card.Header>
      <Card.Body>
        <Inline gap={1}>
          <TypeChip type="fire" />
          <TypeChip type="flying" />
        </Inline>
      </Card.Body>
      <Card.Footer>
        <Button variant="ghost" size="sm">
          Abilities
        </Button>
      </Card.Footer>
    </Card>
  ),
};

export const Elevacoes: Story = {
  name: "Elevações",
  parameters: {
    docs: {
      description: {
        story: [
          "| Elevação | Quando usar |",
          "| --- | --- |",
          "| `flat` | Cartão dentro de cartão, ou lista densa onde a sombra vira ruído |",
          "| `raised` | Padrão |",
          "| `interactive` | **Só quando o cartão inteiro é clicável.** A sombra que responde ao hover é uma promessa: se nada acontece ao clicar, ela mente |",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <CardGrid className="[--grid-card-min:14rem]">
      {(["flat", "raised", "interactive"] as const).map((e) => (
        <Card key={e} elevation={e}>
          <Card.Header>
            <Card.Title>{e}</Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-sm text-text-muted">
              {e === "flat" && "Sem sombra."}
              {e === "raised" && "Sombra sutil. O padrão."}
              {e === "interactive" && "Responde ao ponteiro."}
            </p>
          </Card.Body>
        </Card>
      ))}
    </CardGrid>
  ),
};

export const Composicao: Story = {
  name: "Composição livre",
  parameters: {
    docs: {
      description: {
        story: [
          "Nenhuma parte é obrigatória, e a ordem é de quem monta. Aqui o rodapé",
          "some, um `Badge` entra no cabeçalho e o corpo vira lista — nada disso",
          "exigiu prop nova.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <div className="max-w-sm">
      <Card>
        <Card.Header>
          <Inline justify="between" align="center">
            <Card.Title>Heat Wave</Card.Title>
            <Badge tone="accent">10</Badge>
          </Inline>
        </Card.Header>
        <Card.Body>
          <Stack gap={2}>
            <p className="text-sm text-text-muted">
              Strong against grass, bug, ice and steel.
            </p>
            <Inline gap={1}>
              <TypeChip type="grass" variant="outline" />
              <TypeChip type="bug" variant="outline" />
              <TypeChip type="ice" variant="outline" />
              <TypeChip type="steel" variant="outline" />
            </Inline>
          </Stack>
        </Card.Body>
      </Card>
    </div>
  ),
};

export const Denso: Story = {
  name: "Compacto",
  parameters: {
    docs: {
      description: {
        story:
          "`compact` reduz o respiro sem mexer em raio, borda ou sombra — a carta continua sendo a mesma peça, só mais apertada.",
      },
    },
  },
  render: () => (
    <Inline gap={3} align="start">
      {[false, true].map((c) => (
        <Card key={String(c)} compact={c} className="w-48">
          <Card.Header>
            <Card.Title>{c ? "compact" : "padrão"}</Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-sm text-text-muted">Bulbasaur</p>
          </Card.Body>
        </Card>
      ))}
    </Inline>
  ),
};
