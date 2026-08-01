import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Inline, Stack } from "../primitives/Layout";

const meta = {
  title: "Componentes/Button",
  component: Button,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "O componente que fixa os padrões do sistema. Altura, raio e anel de foco",
          "saem dos tokens `--control-*`, os mesmos que `SearchField` e `Select`",
          "consomem — é o que mantém botão e campo com a mesma altura lado a lado,",
          "sem ninguém ter medido nada.",
          "",
          "**Não existe variante `link`.** Link é `<a>`. Botão que navega e link que",
          "dispara ação quebram atalho de teclado, menu de contexto e leitor de tela.",
          "Para um link com aparência de botão, use `asChild`.",
        ].join("\n"),
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["solid", "soft", "outline", "ghost", "danger"],
      description: "Papel da ação na hierarquia da tela",
    },
    size: { control: "radio", options: ["sm", "md", "lg"] },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
    children: { control: "text" },
  },
  args: { children: "Capturar" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Padrão" };

export const Variantes: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          "Cada variante tem um papel definido — a escolha não é estética:",
          "",
          "| Variante | Quando usar |",
          "| --- | --- |",
          "| `solid` | Ação principal. **No máximo uma por tela** |",
          "| `soft` | Ação secundária frequente; presente sem competir |",
          "| `outline` | Secundária em superfície densa, onde fundo pesaria |",
          "| `ghost` | Terciária, barra de ferramentas, ícone |",
          "| `danger` | Destrutiva. Cor própria, nunca a solid vermelha |",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Inline gap={3}>
      <Button variant="solid">Capturar</Button>
      <Button variant="soft">Comparar</Button>
      <Button variant="outline">Filtrar</Button>
      <Button variant="ghost">Cancelar</Button>
      <Button variant="danger">Remover</Button>
    </Inline>
  ),
};

export const Tamanhos: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "32, 40 e 48px — os mesmos `--control-height-*` dos campos de formulário.",
      },
    },
  },
  render: () => (
    <Inline gap={3} align="center">
      <Button size="sm">Pequeno</Button>
      <Button size="md">Médio</Button>
      <Button size="lg">Grande</Button>
    </Inline>
  ),
};

export const Estados: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          "`loading` desabilita o botão e marca `aria-busy`. Sem esse atributo o",
          "spinner é informação exclusivamente visual — quem usa leitor de tela",
          "não saberia que a ação está em curso.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Inline gap={3}>
        <Button>Normal</Button>
        <Button loading>Carregando</Button>
        <Button disabled>Desabilitado</Button>
      </Inline>
      <Inline gap={3}>
        <Button variant="soft" loading>
          Sincronizando
        </Button>
        <Button variant="outline" disabled>
          Indisponível
        </Button>
      </Inline>
    </Stack>
  ),
};

export const ComIcone: Story = {
  name: "Com ícone",
  render: () => (
    <Inline gap={3}>
      <Button startIcon={<StarIcon />}>Favoritar</Button>
      <Button variant="soft" endIcon={<ArrowIcon />}>
        Ver detalhes
      </Button>
      <Button variant="ghost" iconOnly aria-label="Favoritar">
        <StarIcon />
      </Button>
    </Inline>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "Botão só de ícone **exige** `aria-label` — sem texto visível, não há o que anunciar.",
      },
    },
  },
};

export const ComoLink: Story = {
  name: "Como link (asChild)",
  parameters: {
    docs: {
      description: {
        story: [
          "`asChild` renderiza no elemento filho em vez de num `<button>`. É assim",
          "que se obtém um link com aparência de botão sem aninhar `<a>` dentro de",
          "`<button>`, que é HTML inválido e quebra o comportamento de ambos.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Inline gap={3}>
      <Button asChild>
        <a href="#pokedex">Ir para a Pokédex</a>
      </Button>
      <Button asChild variant="outline">
        <a href="#favoritos">Meus favoritos</a>
      </Button>
      {/*
        Regressão coberta: o Slot do Radix exige exatamente um filho. A
        primeira versão passava startIcon, children e endIcon como irmãos,
        e esta combinação — asChild + ícone — derrubava a árvore inteira.
        Os ícones agora são injetados dentro do elemento filho.
      */}
      <Button asChild variant="soft" startIcon={<StarIcon />}>
        <a href="#favoritos">Com ícone</a>
      </Button>
      <Button asChild variant="ghost" iconOnly>
        <a href="#config" aria-label="Configurações">
          <ArrowIcon />
        </a>
      </Button>
    </Inline>
  ),
};

/**
 * Grade completa. Serve para revisão visual: qualquer mudança de token
 * aparece aqui em todas as combinações de uma vez.
 */
export const Matriz: Story = {
  name: "Matriz completa",
  render: () => (
    <Stack gap={6}>
      {(["solid", "soft", "outline", "ghost", "danger"] as const).map((variant) => (
        <Stack key={variant} gap={2}>
          <p className="font-mono text-xs uppercase tracking-wider text-text-subtle">
            {variant}
          </p>
          <Inline gap={3} align="center">
            <Button variant={variant} size="sm">
              Pequeno
            </Button>
            <Button variant={variant} size="md">
              Médio
            </Button>
            <Button variant={variant} size="lg">
              Grande
            </Button>
            <Button variant={variant} loading>
              Carregando
            </Button>
            <Button variant={variant} disabled>
              Desabilitado
            </Button>
          </Inline>
        </Stack>
      ))}
    </Stack>
  ),
};

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.5l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.3 4.2 13.3l.7-4.3-3.1-3 4.3-.6z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10m0 0l-4-4m4 4l-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
