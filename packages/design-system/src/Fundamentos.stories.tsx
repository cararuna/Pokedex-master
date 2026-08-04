import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack, Inline } from "./primitives/Layout";

/**
 * Páginas de fundamento. Não documentam componente — documentam as decisões
 * que os componentes obedecem.
 */
const meta = {
  // Título sem subnível: as stories deste arquivo cobrem cor, tipografia e
  // forma. Aninhar tudo sob "Fundamentos/Cor" colocaria a página de tipografia
  // dentro da de cor na navegação.
  title: "Fundamentos",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "## As três camadas",
          "",
          "```",
          "01-primitives   rampas cruas          fora do @theme, sem utilitário",
          "02-semantic     papel + tema          gera os utilitários",
          "03-components   decisões por família  --control-*, --card-*",
          "```",
          "",
          "### A regra que sustenta o sistema",
          "",
          "**Componente nunca referencia primitivo.** `Button` usa `--accent-solid`,",
          "jamais `--forest-700`.",
          "",
          "É essa indireção que permite o tema escuro não tocar em componente nenhum:",
          "o modo escuro reaponta o mapeamento da camada 2 e os 13 componentes",
          "acompanham sem saber que existe tema.",
          "",
          "### A regra é verificada, não combinada",
          "",
          "Convenção escrita em README sobrevive umas três semanas. O que sobrevive é",
          "o que quebra o build:",
          "",
          "```bash",
          "pnpm --filter @pokedex/design-system lint:tokens",
          "```",
          "",
          "O linter acusa quatro classes de violação — cor primitiva em `var()`, cor",
          "primitiva em classe, paleta padrão do Tailwind e cor literal — e sai com",
          "código 1.",
          "",
          "Além disso, `--color-*: initial` zera a paleta padrão do Tailwind: `bg-red-500`",
          "simplesmente não renderiza. Sem isso, o design system seria sugestão.",
          "",
          "### O detalhe do `@theme inline`",
          "",
          "```css",
          "@theme inline {",
          "  --color-surface: var(--surface);",
          "}",
          "```",
          "",
          "Sem `inline`, o Tailwind copia o **valor** no momento do build e o utilitário",
          "congela no tema claro. Com `inline`, ele emite `var(--surface)` — reavaliado",
          "quando `[data-theme]` muda no runtime. É a diferença entre um tema trocável",
          "e um tema estático.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Superficies: Story = {
  name: "Superfícies",
  parameters: {
    docs: {
      description: {
        story: [
          "Em ordem de elevação. No tema claro a separação vem da sombra; no escuro,",
          "da borda — sombra não produz contraste sobre fundo quase preto, então quem",
          "separa é o valor. Troque o tema na barra de ferramentas para ver.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Grupo>
      <Amostra token="--surface" classe="bg-surface" nota="fundo da página" />
      <Amostra token="--surface-raised" classe="bg-surface-raised" nota="cartão" />
      <Amostra token="--surface-overlay" classe="bg-surface-overlay" nota="diálogo" />
      <Amostra token="--surface-sunken" classe="bg-surface-sunken" nota="campo" />
      <Amostra token="--surface-inverse" classe="bg-surface-inverse" nota="tooltip" />
    </Grupo>
  ),
};

export const Texto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Três níveis. Além disso vira hierarquia que ninguém enxerga na prática.",
      },
    },
  },
  render: () => (
    <Stack gap={3}>
      <LinhaTexto token="--text" classe="text-text" nota="conteúdo principal" />
      <LinhaTexto token="--text-muted" classe="text-text-muted" nota="apoio, descrição" />
      <LinhaTexto token="--text-subtle" classe="text-text-subtle" nota="metadado, rótulo" />
    </Stack>
  ),
};

export const AcentoEEstado: Story = {
  name: "Acento e estado",
  parameters: {
    docs: {
      description: {
        story: [
          "O acento é verde botânico, e não o vermelho da Pokédex, por dois motivos:",
          "o vermelho brigaria com o token de perigo, e verde sobre marfim é a paleta",
          "de gabinete de história natural que a interface persegue.",
          "",
          "O foco tem token próprio (`--focus-ring`) e **não herda do acento** — se o",
          "anel fosse a cor da marca, sumiria justamente no botão primário, que é onde",
          "mais importa.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Stack gap={6}>
      <Grupo titulo="Acento">
        <Amostra token="--accent-solid" classe="bg-accent-solid" />
        <Amostra token="--accent-soft" classe="bg-accent-soft" />
        <Amostra token="--highlight-solid" classe="bg-highlight-solid" />
        <Amostra token="--highlight-soft" classe="bg-highlight-soft" />
      </Grupo>
      <Grupo titulo="Estado">
        <Amostra token="--success-solid" classe="bg-success-solid" />
        <Amostra token="--warning-solid" classe="bg-warning-solid" />
        <Amostra token="--danger-solid" classe="bg-danger-solid" />
        <Amostra token="--info-solid" classe="bg-info-solid" />
      </Grupo>
    </Stack>
  ),
};

export const Tipografia: Story = {
  parameters: {
    docs: {
      description: {
        story: [
          "**Fraunces** no display, **Inter** na interface, **JetBrains Mono** em dado.",
          "",
          "Fraunces é variável e tem eixo de tamanho óptico (`opsz`): o desenho da letra",
          "muda conforme o corpo, em vez de só escalar. É o que impede um título de 48px",
          "de parecer um de 16px ampliado.",
          "",
          "A escala usa razão ~1.2 (terça menor), mais contida que a 1.25 usual — com",
          "serifada de display, saltos grandes ficam dramáticos demais para um catálogo.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Stack gap={4}>
      <Linha rotulo="display / 4xl" classe="font-display text-4xl">Bulbasaur</Linha>
      <Linha rotulo="display / 3xl" classe="font-display text-3xl">Charmander</Linha>
      <Linha rotulo="display / 2xl" classe="font-display text-2xl">Squirtle</Linha>
      <Linha rotulo="display / xl" classe="font-display text-xl">Pikachu</Linha>
      <Linha rotulo="sans / lg" classe="text-lg">Texto de destaque</Linha>
      <Linha rotulo="sans / base" classe="text-base">
        Corpo de interface em Inter, com as variantes cv02, cv03 e cv04 ligadas.
      </Linha>
      <Linha rotulo="sans / sm" classe="text-sm text-text-muted">Texto secundário</Linha>
      <Linha rotulo="mono / xs" classe="font-mono text-xs uppercase tracking-widest text-text-subtle">
        N.º 001 · Semente
      </Linha>
    </Stack>
  ),
};

export const EspacoEForma: Story = {
  name: "Espaço e forma",
  parameters: {
    docs: {
      description: {
        story: [
          "Base de 4px. A escala tem passos crescentes: fina no começo (ajuste de ícone",
          "e chip), larga no fim (respiro entre seções). Escala linear obriga a inventar",
          "valores fora do sistema nos extremos.",
          "",
          "O raio é deliberadamente contido — raio grande lê como aplicativo de celular,",
          "e o alvo aqui é livro impresso. O maior valor não passa de 12px.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Stack gap={8}>
      <Stack gap={3}>
        <Rotulo>Espaço</Rotulo>
        <Stack gap={2}>
          {["1", "2", "3", "4", "6", "8", "12", "16"].map((n) => (
            <Inline key={n} gap={4} align="center">
              <code className="w-24 font-mono text-2xs text-text-subtle">
                --space-{n}
              </code>
              <div
                className="h-3 rounded-[var(--r-xs)] bg-accent-soft"
                style={{ width: `var(--space-${n})` }}
              />
            </Inline>
          ))}
        </Stack>
      </Stack>

      <Stack gap={3}>
        <Rotulo>Raio</Rotulo>
        <Inline gap={4}>
          {["xs", "sm", "md", "lg", "xl"].map((r) => (
            <Stack key={r} gap={2} align="center">
              <div
                className="size-16 border border-border bg-surface-raised"
                style={{ borderRadius: `var(--r-${r})` }}
              />
              <code className="font-mono text-2xs text-text-subtle">--r-{r}</code>
            </Stack>
          ))}
        </Inline>
      </Stack>

      <Stack gap={3}>
        <Rotulo>Sombra</Rotulo>
        <Inline gap={5}>
          {["xs", "sm", "md", "lg", "xl"].map((s) => (
            <Stack key={s} gap={2} align="center">
              <div
                className="size-16 rounded-[var(--r-md)] bg-surface-raised"
                style={{ boxShadow: `var(--sh-${s})` }}
              />
              <code className="font-mono text-2xs text-text-subtle">--sh-{s}</code>
            </Stack>
          ))}
        </Inline>
        <p className="max-w-[var(--prose-max)] text-sm text-text-muted">
          Duas camadas cada: uma sombra de contato curta e fechada, e uma difusa e
          ampla. Sombra de camada única sempre parece adesivo colado na tela. O
          matiz é quente, não preto puro, para não furar o papel marfim.
        </p>
      </Stack>
    </Stack>
  ),
};

/* ── Auxiliares ─────────────────────────────────────────────────────────── */

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs uppercase tracking-wider text-text-subtle">
      {children}
    </p>
  );
}

function Grupo({ titulo, children }: { titulo?: string; children: React.ReactNode }) {
  return (
    <Stack gap={3}>
      {titulo && <Rotulo>{titulo}</Rotulo>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">{children}</div>
    </Stack>
  );
}

function Amostra({
  token,
  classe,
  nota,
}: {
  token: string;
  classe: string;
  nota?: string;
}) {
  return (
    <Stack gap={2}>
      <div className={`h-20 rounded-[var(--r-md)] border border-border ${classe}`} />
      <Stack gap={0}>
        <code className="font-mono text-2xs text-text">{token}</code>
        {nota && <span className="text-2xs text-text-subtle">{nota}</span>}
      </Stack>
    </Stack>
  );
}

function LinhaTexto({
  token,
  classe,
  nota,
}: {
  token: string;
  classe: string;
  nota: string;
}) {
  return (
    <Inline gap={4} align="baseline">
      <code className="w-40 font-mono text-2xs text-text-subtle">{token}</code>
      <span className={classe}>Charizard cospe fogo</span>
      <span className="text-2xs text-text-subtle">{nota}</span>
    </Inline>
  );
}

function Linha({
  rotulo,
  classe,
  children,
}: {
  rotulo: string;
  classe: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:items-baseline">
      <code className="font-mono text-2xs uppercase tracking-wider text-text-subtle">
        {rotulo}
      </code>
      <div className={classe}>{children}</div>
    </div>
  );
}
