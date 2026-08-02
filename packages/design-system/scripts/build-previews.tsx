/**
 * Gera as previews estáticas publicadas no Claude Design.
 *
 * Renderiza os **componentes reais** com renderToStaticMarkup, em vez de
 * reescrever o HTML à mão. É a diferença entre uma galeria que reflete o
 * código e uma que envelhece em silêncio: se um componente mudar, a preview
 * muda junto na próxima execução.
 *
 * Cada arquivo abre com um marcador `@dsCard`, que é como o painel do Claude
 * Design monta o índice de cards.
 *
 * Uso:  pnpm --filter @pokedex/design-system previews
 */

import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";
import { Card } from "../src/components/Card";
import { Skeleton } from "../src/components/Skeleton";
import { TypeChip, POKEMON_TYPES } from "../src/components/TypeChip";
import { Stack, Inline, Divider } from "../src/primitives/Layout";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, "../previews");
// Dentro do pacote, e não em /tmp: no Windows o "/tmp" do shell vira
// "D:\tmp" quando o Node resolve o caminho, e o arquivo não é encontrado.
const CSS = readFileSync(join(AQUI, "../previews/.ds.css"), "utf8");

interface Card_ {
  arquivo: string;
  nome: string;
  grupo: string;
  subtitulo: string;
  /** Renderiza em tema escuro. */
  escuro?: boolean;
  conteudo: React.ReactNode;
}

function pagina(card: Card_): string {
  const corpo = renderToStaticMarkup(<>{card.conteudo}</>);
  return `<!-- @dsCard group="${card.grupo}" -->
<!doctype html>
<html lang="pt-BR" data-theme="${card.escuro ? "dark" : "light"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${card.nome}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${CSS}</style>
<style>
  body { padding: 2rem; background: var(--surface); }
  .ds-titulo { font-family: var(--ff-mono); font-size: var(--fs-2xs);
    text-transform: uppercase; letter-spacing: var(--ls-widest);
    color: var(--text-subtle); margin-bottom: 1.25rem; }
</style>
</head>
<body>
<p class="ds-titulo">${card.subtitulo}</p>
${corpo}
</body>
</html>`;
}

/* ── Auxiliares de composição ────────────────────────────────────────────── */

const Rotulo = ({ children }: { children: React.ReactNode }) => (
  <p className="font-mono text-2xs uppercase tracking-wider text-text-subtle">
    {children}
  </p>
);

const Amostra = ({ token, classe, nota }: { token: string; classe: string; nota?: string }) => (
  <Stack gap={2}>
    <div className={`h-16 rounded-[var(--r-md)] border border-border ${classe}`} />
    <Stack gap={0}>
      <code className="font-mono text-2xs text-text">{token}</code>
      {nota && <span className="text-2xs text-text-subtle">{nota}</span>}
    </Stack>
  </Stack>
);

/* ── Os cards ────────────────────────────────────────────────────────────── */

const CARDS: Card_[] = [
  {
    arquivo: "foundations/cor.html",
    nome: "Cor",
    grupo: "Foundations",
    subtitulo: "Tokens semânticos · componente nunca referencia primitivo",
    conteudo: (
      <Stack gap={8}>
        <Stack gap={3}>
          <Rotulo>Superfície — em ordem de elevação</Rotulo>
          <div className="grid grid-cols-5 gap-4">
            <Amostra token="--surface" classe="bg-surface" nota="página" />
            <Amostra token="--surface-raised" classe="bg-surface-raised" nota="cartão" />
            <Amostra token="--surface-overlay" classe="bg-surface-overlay" nota="diálogo" />
            <Amostra token="--surface-sunken" classe="bg-surface-sunken" nota="campo" />
            <Amostra token="--surface-inverse" classe="bg-surface-inverse" nota="tooltip" />
          </div>
        </Stack>
        <Stack gap={3}>
          <Rotulo>Acento e destaque</Rotulo>
          <div className="grid grid-cols-5 gap-4">
            <Amostra token="--accent-solid" classe="bg-accent-solid" />
            <Amostra token="--accent-soft" classe="bg-accent-soft" />
            <Amostra token="--highlight-solid" classe="bg-highlight-solid" />
            <Amostra token="--highlight-soft" classe="bg-highlight-soft" />
            <Amostra token="--focus-ring" classe="bg-[var(--focus-ring)]" nota="token próprio" />
          </div>
        </Stack>
        <Stack gap={3}>
          <Rotulo>Estado</Rotulo>
          <div className="grid grid-cols-5 gap-4">
            <Amostra token="--success-solid" classe="bg-success-solid" />
            <Amostra token="--warning-solid" classe="bg-warning-solid" />
            <Amostra token="--danger-solid" classe="bg-danger-solid" />
            <Amostra token="--info-solid" classe="bg-info-solid" />
          </div>
        </Stack>
      </Stack>
    ),
  },
  {
    arquivo: "foundations/cor-escuro.html",
    nome: "Cor — tema escuro",
    grupo: "Foundations",
    subtitulo: "Os mesmos tokens, remapeados. Nenhum componente muda.",
    escuro: true,
    conteudo: (
      <Stack gap={8}>
        <Stack gap={3}>
          <Rotulo>Superfície — no escuro, elevação sobe em direção à luz</Rotulo>
          <div className="grid grid-cols-5 gap-4">
            <Amostra token="--surface" classe="bg-surface" nota="página" />
            <Amostra token="--surface-raised" classe="bg-surface-raised" nota="cartão" />
            <Amostra token="--surface-overlay" classe="bg-surface-overlay" nota="diálogo" />
            <Amostra token="--surface-sunken" classe="bg-surface-sunken" nota="campo" />
            <Amostra token="--surface-inverse" classe="bg-surface-inverse" nota="tooltip" />
          </div>
        </Stack>
        <Stack gap={3}>
          <Rotulo>Acento — clareia, senão sumiria sobre fundo quase preto</Rotulo>
          <div className="grid grid-cols-5 gap-4">
            <Amostra token="--accent-solid" classe="bg-accent-solid" />
            <Amostra token="--accent-soft" classe="bg-accent-soft" />
            <Amostra token="--highlight-solid" classe="bg-highlight-solid" />
            <Amostra token="--highlight-soft" classe="bg-highlight-soft" />
          </div>
        </Stack>
        <Inline gap={3}>
          <Button variant="solid">Capturar</Button>
          <Button variant="soft">Comparar</Button>
          <Button variant="outline">Filtrar</Button>
          <Button variant="ghost">Cancelar</Button>
        </Inline>
      </Stack>
    ),
  },
  {
    arquivo: "foundations/tipografia.html",
    nome: "Tipografia",
    grupo: "Foundations",
    subtitulo: "Fraunces no display · Inter na interface · razão 1.2",
    conteudo: (
      <Stack gap={5}>
        {[
          ["display / 4xl", "font-display text-4xl", "Bulbasaur"],
          ["display / 3xl", "font-display text-3xl", "Charmander"],
          ["display / 2xl", "font-display text-2xl", "Squirtle"],
          ["display / xl", "font-display text-xl", "Pikachu"],
          ["sans / base", "text-base", "Corpo de interface em Inter, com as variantes cv02, cv03 e cv04 ligadas."],
          ["sans / sm", "text-sm text-text-muted", "Texto secundário, para apoio e metadados."],
          ["mono / xs", "font-mono text-xs uppercase tracking-widest text-text-subtle", "N.º 001 · Semente"],
        ].map(([rotulo, classe, texto]) => (
          <div key={rotulo} className="grid grid-cols-[11rem_1fr] items-baseline gap-4">
            <code className="font-mono text-2xs uppercase tracking-wider text-text-subtle">
              {rotulo}
            </code>
            <div className={classe}>{texto}</div>
          </div>
        ))}
      </Stack>
    ),
  },
  {
    arquivo: "foundations/forma.html",
    nome: "Espaço, raio e sombra",
    grupo: "Foundations",
    subtitulo: "Base 4px · raio contido · sombra em duas camadas",
    conteudo: (
      <Stack gap={8}>
        <Stack gap={3}>
          <Rotulo>Espaço</Rotulo>
          <Stack gap={2}>
            {["1", "2", "3", "4", "6", "8", "12", "16"].map((n) => (
              <Inline key={n} gap={4} align="center">
                <code className="w-24 font-mono text-2xs text-text-subtle">--space-{n}</code>
                <div className="h-3 rounded-[var(--r-xs)] bg-accent-soft" style={{ width: `var(--space-${n})` }} />
              </Inline>
            ))}
          </Stack>
        </Stack>
        <Stack gap={3}>
          <Rotulo>Raio — o maior valor não passa de 12px</Rotulo>
          <Inline gap={5}>
            {["xs", "sm", "md", "lg", "xl"].map((r) => (
              <Stack key={r} gap={2} align="center">
                <div className="size-16 border border-border bg-surface-raised" style={{ borderRadius: `var(--r-${r})` }} />
                <code className="font-mono text-2xs text-text-subtle">--r-{r}</code>
              </Stack>
            ))}
          </Inline>
        </Stack>
        <Stack gap={3}>
          <Rotulo>Sombra — duas camadas, matiz quente</Rotulo>
          <Inline gap={6}>
            {["xs", "sm", "md", "lg", "xl"].map((s) => (
              <Stack key={s} gap={2} align="center">
                <div className="size-16 rounded-[var(--r-md)] bg-surface-raised" style={{ boxShadow: `var(--sh-${s})` }} />
                <code className="font-mono text-2xs text-text-subtle">--sh-{s}</code>
              </Stack>
            ))}
          </Inline>
        </Stack>
      </Stack>
    ),
  },
  {
    arquivo: "components/button.html",
    nome: "Button",
    grupo: "Components",
    subtitulo: "5 variantes × 3 tamanhos · altura vinda de --control-*",
    conteudo: (
      <Stack gap={7}>
        {(["solid", "soft", "outline", "ghost", "danger"] as const).map((v) => (
          <Stack key={v} gap={2}>
            <Rotulo>{v}</Rotulo>
            <Inline gap={3} align="center">
              <Button variant={v} size="sm">Pequeno</Button>
              <Button variant={v} size="md">Médio</Button>
              <Button variant={v} size="lg">Grande</Button>
              <Button variant={v} loading>Carregando</Button>
              <Button variant={v} disabled>Desabilitado</Button>
            </Inline>
          </Stack>
        ))}
      </Stack>
    ),
  },
  {
    arquivo: "components/type-chip.html",
    nome: "TypeChip",
    grupo: "Components",
    subtitulo: "18 tipos · substituiu ~600 linhas de CSS",
    conteudo: (
      <Stack gap={7}>
        <Stack gap={2}>
          <Rotulo>Os 18 tipos — mesma faixa de luminância</Rotulo>
          <Inline gap={2}>
            {POKEMON_TYPES.map((t) => <TypeChip key={t} type={t} />)}
          </Inline>
        </Stack>
        {(["soft", "solid", "outline"] as const).map((v) => (
          <Stack key={v} gap={2}>
            <Rotulo>{v}</Rotulo>
            <Inline gap={2}>
              {(["fire", "water", "grass", "electric", "psychic", "dragon"] as const).map((t) => (
                <TypeChip key={t} type={t} variant={v} />
              ))}
            </Inline>
          </Stack>
        ))}
      </Stack>
    ),
  },
  {
    arquivo: "components/badge.html",
    nome: "Badge",
    grupo: "Components",
    subtitulo: "7 tons × 3 variantes · paleta semântica",
    conteudo: (
      <Stack gap={6}>
        {(["soft", "solid", "outline"] as const).map((v) => (
          <Stack key={v} gap={2}>
            <Rotulo>{v}</Rotulo>
            <Inline gap={2}>
              {(["neutral", "accent", "highlight", "success", "warning", "danger", "info"] as const).map((t) => (
                <Badge key={t} tone={t} variant={v} dot>{t}</Badge>
              ))}
            </Inline>
          </Stack>
        ))}
      </Stack>
    ),
  },
  {
    arquivo: "components/card.html",
    nome: "Card",
    grupo: "Components",
    subtitulo: "Composto por partes, não por props",
    conteudo: (
      <div className="grid grid-cols-3 gap-5">
        <Card elevation="interactive">
          <Card.Header>
            <Inline justify="between" align="start">
              <span className="font-mono text-xs text-text-subtle">N.º 006</span>
              <Badge tone="highlight" size="sm" dot>Favorito</Badge>
            </Inline>
            <Card.Title>Charizard</Card.Title>
            <Card.Description>Cospe fogo quente o bastante para derreter pedras.</Card.Description>
          </Card.Header>
          <Card.Body>
            <Inline gap={1}>
              <TypeChip type="fire" size="sm" />
              <TypeChip type="flying" size="sm" />
            </Inline>
          </Card.Body>
          <Card.Footer>
            <Button size="sm" variant="ghost">Detalhes</Button>
          </Card.Footer>
        </Card>

        <Card elevation="raised">
          <Card.Header>
            <span className="font-mono text-xs text-text-subtle">N.º 009</span>
            <Card.Title>Blastoise</Card.Title>
            <Card.Description>Os canhões nas costas disparam jatos com precisão.</Card.Description>
          </Card.Header>
          <Card.Body>
            <Inline gap={1}><TypeChip type="water" size="sm" /></Inline>
          </Card.Body>
          <Card.Footer>
            <Button size="sm" variant="ghost">Detalhes</Button>
          </Card.Footer>
        </Card>

        <Card>
          <Card.Header>
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="60%" className="h-6" />
            <Skeleton variant="text" lines={2} />
          </Card.Header>
          <Card.Body>
            <Inline gap={2}>
              <Skeleton width={64} height={22} />
              <Skeleton width={64} height={22} />
            </Inline>
          </Card.Body>
          <Card.Footer><Skeleton width={80} height={32} /></Card.Footer>
        </Card>
      </div>
    ),
  },
  {
    arquivo: "components/estados.html",
    nome: "Estados de carregamento",
    grupo: "Components",
    subtitulo: "Skeleton com a forma do conteúdo — sem deslocar layout",
    conteudo: (
      <Stack gap={6}>
        <Stack gap={3}>
          <Rotulo>Variantes</Rotulo>
          <Inline gap={5} align="center">
            <Skeleton variant="circle" width={48} height={48} />
            <Skeleton variant="rect" width={160} height={48} />
            <div className="w-64"><Skeleton variant="text" lines={3} /></div>
          </Inline>
        </Stack>
        <Divider />
        <Stack gap={3}>
          <Rotulo>Botões em carregamento — aria-busy anuncia o estado</Rotulo>
          <Inline gap={3}>
            <Button loading>Capturando</Button>
            <Button variant="soft" loading>Sincronizando</Button>
            <Button variant="outline" loading>Buscando</Button>
          </Inline>
        </Stack>
      </Stack>
    ),
  },
];

/* ── Execução ────────────────────────────────────────────────────────────── */

for (const card of CARDS) {
  const destino = join(SAIDA, card.arquivo);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, pagina(card));
  console.log(`  ✓ ${card.arquivo.padEnd(32)} ${card.grupo} · ${card.nome}`);
}

console.log(`\n✓ ${CARDS.length} previews em packages/design-system/previews/`);
