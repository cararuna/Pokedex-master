import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardGrid,
  Container,
  Dialog,
  Divider,
  EmptyState,
  Inline,
  Pagination,
  SearchField,
  Select,
  Skeleton,
  Stack,
  StatBar,
  Table,
  Tabs,
  Tooltip,
  TooltipProvider,
  TypeChip,
  POKEMON_TYPES,
  useTheme,
} from "@pokedex/design-system";

/**
 * Vitrine do design system dentro do app.
 *
 * O Storybook é a documentação oficial; esta página existe para ver os
 * componentes no contexto real da aplicação — mesmas fontes, mesmo reset,
 * mesmo provedor de tema. Componente que parece certo isolado e errado em
 * produção é um problema que só aparece aqui.
 */
export function DesignSystemPage() {
  const { theme, toggle } = useTheme();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<string>();
  const [pagina, setPagina] = useState(3);

  return (
    <TooltipProvider>
    <Container className="py-12">
      <Stack gap={12}>
        <header>
          <Inline justify="between" align="start">
            <Stack gap={2}>
              <p className="font-mono text-xs uppercase tracking-widest text-text-subtle">
                Pokédex · Design System
              </p>
              <h1 className="text-4xl">Fundamentos</h1>
              <p className="max-w-[var(--prose-max)] text-text-muted">
                Catálogo de história natural: papel marfim, tinta quente, verde
                botânico e latão. Cada valor abaixo vem de um token — não há
                uma única cor literal nesta página.
              </p>
            </Stack>
            <Button variant="outline" size="sm" onClick={toggle}>
              {theme === "dark" ? "Tema claro" : "Tema escuro"}
            </Button>
          </Inline>
        </header>

        <Divider />

        {/* ── Cor ─────────────────────────────────────────────────────── */}
        <Section
          titulo="Cor"
          descricao="Tokens semânticos, não valores. É esta camada que os componentes consomem — trocar o tema reaponta o mapeamento e nenhum componente muda."
        >
          <Stack gap={6}>
            <AmostraGrupo titulo="Superfície">
              <Amostra token="--surface" classe="bg-surface" />
              <Amostra token="--surface-raised" classe="bg-surface-raised" />
              <Amostra token="--surface-sunken" classe="bg-surface-sunken" />
              <Amostra token="--surface-inverse" classe="bg-surface-inverse" />
            </AmostraGrupo>

            <AmostraGrupo titulo="Acento e destaque">
              <Amostra token="--accent-solid" classe="bg-accent-solid" />
              <Amostra token="--accent-soft" classe="bg-accent-soft" />
              <Amostra token="--highlight-solid" classe="bg-highlight-solid" />
              <Amostra token="--highlight-soft" classe="bg-highlight-soft" />
            </AmostraGrupo>

            <AmostraGrupo titulo="Estado">
              <Amostra token="--success-solid" classe="bg-success-solid" />
              <Amostra token="--warning-solid" classe="bg-warning-solid" />
              <Amostra token="--danger-solid" classe="bg-danger-solid" />
              <Amostra token="--info-solid" classe="bg-info-solid" />
            </AmostraGrupo>
          </Stack>
        </Section>

        <Divider />

        {/* ── Tipografia ──────────────────────────────────────────────── */}
        <Section
          titulo="Tipografia"
          descricao="Fraunces no display, Inter na interface. A escala usa razão 1.2 — contida de propósito: com serifada, saltos grandes ficam dramáticos demais para um catálogo."
        >
          <Stack gap={4}>
            <LinhaTipo rotulo="display / 4xl" classe="font-display text-4xl">
              Bulbasaur
            </LinhaTipo>
            <LinhaTipo rotulo="display / 3xl" classe="font-display text-3xl">
              Charmander
            </LinhaTipo>
            <LinhaTipo rotulo="display / 2xl" classe="font-display text-2xl">
              Squirtle
            </LinhaTipo>
            <LinhaTipo rotulo="sans / base" classe="text-base">
              O texto de interface usa Inter, com as variantes cv02, cv03 e cv04
              ligadas — desenhos alternativos de l, i e r que reduzem confusão
              em corpo pequeno.
            </LinhaTipo>
            <LinhaTipo rotulo="sans / sm muted" classe="text-sm text-text-muted">
              Texto secundário, para apoio e metadados.
            </LinhaTipo>
            <LinhaTipo
              rotulo="mono / xs"
              classe="font-mono text-xs uppercase tracking-widest text-text-subtle"
            >
              N.º 001 · Semente
            </LinhaTipo>
          </Stack>
        </Section>

        <Divider />

        {/* ── Botões ──────────────────────────────────────────────────── */}
        <Section
          titulo="Button"
          descricao="Cinco variantes com papéis distintos. Altura, raio e anel de foco vêm dos tokens --control-*, os mesmos que os campos usam — é o que mantém botão e campo alinhados lado a lado."
        >
          <Stack gap={5}>
            <Inline gap={3}>
              <Button variant="solid">Capturar</Button>
              <Button variant="soft">Comparar</Button>
              <Button variant="outline">Filtrar</Button>
              <Button variant="ghost">Cancelar</Button>
              <Button variant="danger">Remover</Button>
            </Inline>
            <Inline gap={3} align="center">
              <Button size="sm">Pequeno</Button>
              <Button size="md">Médio</Button>
              <Button size="lg">Grande</Button>
            </Inline>
            <Inline gap={3}>
              <Button loading>Carregando</Button>
              <Button disabled>Desabilitado</Button>
              <Button variant="soft" loading>
                Sincronizando
              </Button>
            </Inline>
          </Stack>
        </Section>

        <Divider />

        {/* ── Tipos ───────────────────────────────────────────────────── */}
        <Section
          titulo="TypeChip"
          descricao="Os 18 tipos elementais. Substitui ~600 linhas de CSS do projeto antigo, onde cada tipo tinha um bloco próprio com border de 24px. Aqui o tipo é dado: a cor sai de --color-type-{tipo}, e acrescentar um tipo é uma linha de token."
        >
          <Stack gap={5}>
            <Inline gap={2}>
              {POKEMON_TYPES.map((t) => (
                <TypeChip key={t} type={t} />
              ))}
            </Inline>
            <Stack gap={2}>
              <p className="text-xs uppercase tracking-wider text-text-subtle">
                Variantes
              </p>
              <Inline gap={2}>
                <TypeChip type="fire" variant="soft" />
                <TypeChip type="fire" variant="solid" />
                <TypeChip type="fire" variant="outline" />
                <TypeChip type="water" variant="soft" />
                <TypeChip type="water" variant="solid" />
                <TypeChip type="water" variant="outline" />
              </Inline>
            </Stack>
          </Stack>
        </Section>

        <Divider />

        {/* ── Badge ───────────────────────────────────────────────────── */}
        <Section
          titulo="Badge"
          descricao="Rótulo genérico de estado, sobre a paleta semântica. Separado do TypeChip de propósito: o chip é de domínio e evolui com regras próprias."
        >
          <Inline gap={2}>
            <Badge tone="neutral">Neutro</Badge>
            <Badge tone="accent">Acento</Badge>
            <Badge tone="highlight" dot>
              Favorito
            </Badge>
            <Badge tone="success" dot>
              Capturado
            </Badge>
            <Badge tone="warning">Raro</Badge>
            <Badge tone="danger">Lendário</Badge>
            <Badge tone="info" variant="outline">
              Gen. I
            </Badge>
          </Inline>
        </Section>

        <Divider />

        {/* ── Campo ───────────────────────────────────────────────────── */}
        <Section
          titulo="SearchField"
          descricao="Rótulo real associado por id, não placeholder fazendo as vezes de rótulo. aria-invalid e aria-describedby ligam campo, dica e erro para leitores de tela."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <SearchField
              label="Buscar Pokémon"
              placeholder="Digite um nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onClear={() => setBusca("")}
              hint="Busca por nome ou número da Pokédex"
            />
            <SearchField
              label="Com erro"
              placeholder="Digite um nome"
              defaultValue="xyz"
              error="Nenhum Pokémon encontrado com esse nome"
            />
          </div>
        </Section>

        <Divider />

        {/* ── Cartão ──────────────────────────────────────────────────── */}
        <Section
          titulo="Card"
          descricao="Composto por partes em vez de props. No tema claro a separação vem da sombra; no escuro, da borda — sombra não produz contraste sobre fundo quase preto."
        >
          <CardGrid>
            <Card elevation="interactive">
              <Card.Header>
                <Inline justify="between" align="start">
                  <span className="font-mono text-xs text-text-subtle">
                    N.º 006
                  </span>
                  <Badge tone="highlight" size="sm" dot>
                    Favorito
                  </Badge>
                </Inline>
                <Card.Title>Charizard</Card.Title>
                <Card.Description>
                  Cospe fogo quente o bastante para derreter pedras.
                </Card.Description>
              </Card.Header>
              <Card.Body>
                <Inline gap={1.5 as never}>
                  <TypeChip type="fire" size="sm" />
                  <TypeChip type="flying" size="sm" />
                </Inline>
              </Card.Body>
              <Card.Footer>
                <Button size="sm" variant="ghost">
                  Detalhes
                </Button>
              </Card.Footer>
            </Card>

            <Card elevation="interactive">
              <Card.Header>
                <Inline justify="between" align="start">
                  <span className="font-mono text-xs text-text-subtle">
                    N.º 009
                  </span>
                </Inline>
                <Card.Title>Blastoise</Card.Title>
                <Card.Description>
                  Os canhões nas costas disparam jatos de água com precisão.
                </Card.Description>
              </Card.Header>
              <Card.Body>
                <Inline gap={1.5 as never}>
                  <TypeChip type="water" size="sm" />
                </Inline>
              </Card.Body>
              <Card.Footer>
                <Button size="sm" variant="ghost">
                  Detalhes
                </Button>
              </Card.Footer>
            </Card>

            {/* Estado de carregamento, com a mesma forma do conteúdo real */}
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
              <Card.Footer>
                <Skeleton width={80} height={32} />
              </Card.Footer>
            </Card>
          </CardGrid>
        </Section>

        <Divider />

        {/* ── Select, Tooltip, Dialog ─────────────────────────────────── */}
        <Section
          titulo="Overlays"
          descricao="Dialog, Select e Tooltip sobre Radix. A aparência é 100% nossa; o que vem de fora é o comportamento — foco preso, foco devolvido ao gatilho, Escape, navegação por seta. Escrever isso na mão é onde implementações caseiras falham, sempre no teclado e no leitor de tela."
        >
          <Stack gap={5}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Select
                label="Filtrar por tipo"
                placeholder="Todos os tipos"
                value={tipo}
                onValueChange={setTipo}
                hint="A lista mostra o chip colorido — impossível no <select> nativo"
                options={POKEMON_TYPES.slice(0, 8).map((t) => ({
                  value: t,
                  label: t,
                  adornment: <TypeChip type={t} size="sm" iconOnly />,
                }))}
              />
              <Stack gap={2} justify="end">
                <Inline gap={3}>
                  <Dialog>
                    <Dialog.Trigger asChild>
                      <Button variant="outline">Abrir diálogo</Button>
                    </Dialog.Trigger>
                    <Dialog.Content>
                      <Dialog.Header>
                        <Dialog.Title>Remover dos favoritos</Dialog.Title>
                        <Dialog.Description>
                          Charizard sai da sua lista. Dá para adicionar de novo
                          a qualquer momento.
                        </Dialog.Description>
                      </Dialog.Header>
                      <Dialog.Footer>
                        <Dialog.Close asChild>
                          <Button variant="ghost">Cancelar</Button>
                        </Dialog.Close>
                        <Dialog.Close asChild>
                          <Button variant="danger">Remover</Button>
                        </Dialog.Close>
                      </Dialog.Footer>
                    </Dialog.Content>
                  </Dialog>

                  <Tooltip content="Aparece no foco também, não só no hover">
                    <Button variant="ghost">Passe o mouse ou dê Tab</Button>
                  </Tooltip>
                </Inline>
              </Stack>
            </div>
          </Stack>
        </Section>

        <Divider />

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <Section
          titulo="Tabs"
          descricao="Substitui o card com flip 3D da versão antiga. O flip escondia o conteúdo da frente, não tinha estado navegável e não existia para leitor de tela — quem não via a animação não sabia que havia um verso."
        >
          <Tabs defaultValue="stats">
            <Tabs.List>
              <Tabs.Trigger value="stats">Atributos</Tabs.Trigger>
              <Tabs.Trigger value="moves">Golpes</Tabs.Trigger>
              <Tabs.Trigger value="talents">Talentos</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="stats">
              <Stack gap={2} className="max-w-lg">
                <StatBar label="HP" value={78} />
                <StatBar label="Ataque" value={84} />
                <StatBar label="Defesa" value={78} />
                <StatBar label="Ataque Esp." value={109} />
                <StatBar label="Defesa Esp." value={85} />
                <StatBar label="Velocidade" value={100} />
              </Stack>
            </Tabs.Content>

            <Tabs.Content value="moves">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Golpe</Table.Head>
                    <Table.Head>Tipo</Table.Head>
                    <Table.Head>Poder</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {[
                    { nome: "Lança-chamas", tipo: "fire" as const, poder: 90 },
                    { nome: "Garra de Dragão", tipo: "dragon" as const, poder: 80 },
                    { nome: "Rajada de Ar", tipo: "flying" as const, poder: 60 },
                  ].map((m) => (
                    <Table.Row key={m.nome} interactive>
                      <Table.Cell className="font-medium">{m.nome}</Table.Cell>
                      <Table.Cell>
                        <TypeChip type={m.tipo} size="sm" />
                      </Table.Cell>
                      <Table.Cell className="font-mono tabular-nums">
                        {m.poder}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Tabs.Content>

            <Tabs.Content value="talents">
              <EmptyState
                title="Nenhum talento cadastrado"
                description="Os talentos por tipo e as habilidades inatas ainda vivem mockados no front. A Fase 2 migra tudo para o banco."
                action={{ label: "Ver o plano", onClick: () => {} }}
              />
            </Tabs.Content>
          </Tabs>
        </Section>

        <Divider />

        {/* ── Paginação ───────────────────────────────────────────────── */}
        <Section
          titulo="Pagination"
          descricao="É um <nav> com aria-label, e a página atual carrega aria-current. Sem isso, quem navega por leitor de tela ouve uma fileira de números sem saber onde está."
        >
          <Pagination page={pagina} totalPages={12} onPageChange={setPagina} />
        </Section>
      </Stack>
    </Container>
    </TooltipProvider>
  );
}

/* ── Auxiliares da vitrine ─────────────────────────────────────────────── */

function Section({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <Stack gap={6}>
        <Stack gap={2}>
          <h2 className="text-2xl">{titulo}</h2>
          <p className="max-w-[var(--prose-max)] text-sm leading-relaxed text-text-muted">
            {descricao}
          </p>
        </Stack>
        {children}
      </Stack>
    </section>
  );
}

function AmostraGrupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <Stack gap={3}>
      <p className="text-xs uppercase tracking-wider text-text-subtle">
        {titulo}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </Stack>
  );
}

function Amostra({ token, classe }: { token: string; classe: string }) {
  return (
    <Stack gap={2}>
      <div
        className={`h-16 rounded-[var(--r-md)] border border-border ${classe}`}
      />
      <code className="font-mono text-2xs text-text-subtle">{token}</code>
    </Stack>
  );
}

function LinhaTipo({
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
