# 02 — Design system

Este é o documento que mais importa para a vaga. Se você só puder estudar um,
estude este.

## O ponto de partida

O CSS anterior tinha ~1.800 linhas assim:

```css
/* Tipo Fogo */
.fire {
  border: 24px solid #fed400;
  background-color: #eb1c34;
  box-shadow: 2px 5px #fed400;
}
/* Tipo Água */
.water {
  border: 24px solid #2babe2;
  background-color: #302788;
  box-shadow: 2px 5px #2babe2;
}
/* …mais dezesseis blocos idênticos em estrutura */
```

Os sintomas são todos consequência da mesma causa — **não existia camada de
abstração entre o valor e o uso**:

- acrescentar um tipo significava escrever mais um bloco de CSS;
- mudar a espessura da borda significava editar 18 lugares;
- tema escuro era impossível sem duplicar tudo;
- `!important` aparecia sempre que duas regras brigavam.

## As três camadas

```
01-primitives.css   material bruto        fora do @theme → NÃO gera utilitário
02-semantic.css     papel + tema          gera os utilitários
03-components.css   decisões por família  --control-*, --card-*, --chip-*
04-base.css         elementos nus
```

### Camada 1 — primitivos

Rampas de cor e escalas numéricas, sem nenhuma noção de onde serão usadas.
`--ink-700` não sabe que é cor de texto.

```css
--ink-700: #4c463d;
--forest-700: #2e4e44;
--space-4: 1rem;
--r-md: 5px;
```

Uma escolha que vale explicar: a rampa neutra é **quente**, não cinza puro. Um
`#808080` ao lado do papel marfim parece sujo e azulado. Toda a rampa carrega o
mesmo viés do papel.

### Camada 2 — semântica

Aqui os primitivos ganham papel. É a camada que os componentes consomem.

```css
:root {
  --surface: var(--paper-100);
  --text: var(--ink-900);
  --accent-solid: var(--forest-700);
}

[data-theme="dark"] {
  --surface: var(--ink-950);
  --text: var(--ink-100);
  --accent-solid: var(--forest-500);   /* clareia: o 700 sumiria no escuro */
}
```

**É esta indireção que faz o tema escuro existir.** O modo escuro não reescreve
componente nenhum — reaponta o mapeamento acima, e os 14 componentes acompanham
sem saber que existe tema.

Um detalhe que vale saber defender: o token de foco **não herda do acento**.

```css
--focus-ring: var(--forest-500);   /* token próprio, não var(--accent-solid) */
```

Se o anel de foco fosse a cor da marca, ele sumiria justamente sobre o botão
primário — que é onde mais importa.

### Camada 3 — tokens de componente

Decisões que valem para uma família inteira:

```css
--control-height-md: 2.5rem;   /* Button, Input, Select, SearchField */
--card-radius: var(--r-lg);
--chip-height: 1.375rem;
```

Sem esta camada, "a altura do botão médio" ficaria repetida em quatro
componentes e os quatro sairiam de sincronia no primeiro ajuste. Com ela,
`--control-height-md` é editado num lugar e um botão ao lado de um campo tem
exatamente a mesma altura — sem ninguém ter medido nada.

---

## A regra, e por que ela é verificada

> **Componente nunca referencia primitivo.**
> `Button` usa `--accent-solid`, jamais `--forest-700`.

Convenção escrita em README sobrevive umas três semanas. O que sobrevive é o
que quebra o build:

```bash
pnpm --filter @pokedex/design-system lint:tokens
```

[`scripts/lint-tokens.mjs`](../packages/design-system/scripts/lint-tokens.mjs)
audita os arquivos de componente e acusa quatro classes de violação:

| Regra | Exemplo pego | Por que é erro |
|---|---|---|
| `cor-primitiva-em-var` | `var(--ink-700)` | Congela o componente num tema |
| `cor-primitiva-em-classe` | `bg-forest-600` | Idem |
| `paleta-do-tailwind` | `text-red-500` | A paleta padrão está zerada; não renderiza nada |
| `cor-literal` | `#ff0000` | Sai do inventário de tokens |

Sai com código 1. Testado com violação deliberada: pega as quatro.

E há uma segunda linha de defesa, no compilador:

```css
@theme inline {
  --color-*: initial;    /* zera a paleta padrão do Tailwind */
  --color-surface: var(--surface);
  …
}
```

Sem isso, `bg-red-500` continua funcionando e o design system vira sugestão.
Com isso, ele é a única forma de escrever cor.

---

## O detalhe do `@theme inline`

Este é o ponto técnico mais específico do documento, e provavelmente o que
diferencia numa entrevista sobre Tailwind v4.

```css
/* SEM inline */
@theme { --color-surface: var(--surface); }
```

O Tailwind **copia o valor** no momento do build. O utilitário nasce com a cor
do tema claro cravada e nunca muda.

```css
/* COM inline */
@theme inline { --color-surface: var(--surface); }
```

O utilitário é emitido referenciando a variável:

```css
.bg-accent-solid { background-color: var(--accent-solid); }
```

Que é reavaliada quando `[data-theme]` muda no runtime. **É a diferença entre
um tema trocável e um tema estático.**

Verificado no CSS compilado — a regra gerada é exatamente a de cima.

### Uma armadilha que custou tempo

Os primitivos usam prefixos próprios (`--ez-*`, `--fs-*`, `--r-*`, `--sh-*`) e
não os nomes óbvios. O motivo:

```css
/* --ease-* é namespace do Tailwind. Isto produz: */
@theme inline { --ease-out: var(--ease-out); }
/*                          ↑ referência circular, descartada em silêncio */
```

Nomear o primitivo igual ao namespace gera uma definição que aponta para si
mesma. O navegador descarta sem avisar, e a transição simplesmente não acontece.

Outra: os 18 tokens de cor de tipo ficam em `:root` puro, **fora do `@theme`**.
O Tailwind remove do bundle todo token do `@theme` que nenhum utilitário
referencia — e o `TypeChip` monta o nome da variável em tempo de execução
(`var(--color-type-${tipo})`), coisa que o tree-shaking não enxerga. Dentro do
`@theme`, os 18 seriam apagados.

---

## Decisões de componente

### Composição em vez de props

```tsx
// ✗ Cada caso novo vira uma prop nova
<Card title="Charizard" footer={<Button/>} titleIcon={...} headerAction={...} />

// ✓ O consumidor monta o que precisar; a API não cresce
<Card>
  <Card.Header>
    <Card.Title>Charizard</Card.Title>
  </Card.Header>
  <Card.Footer><Button/></Card.Footer>
</Card>
```

### Radix onde o comportamento é caro

`Dialog`, `Select`, `Tabs`, `Tooltip` e `Drawer` usam Radix. **A aparência é
100% nossa** — o Radix não traz estilo. O que vem de fora é comportamento:
foco preso dentro do modal, foco devolvido ao gatilho ao fechar, `aria-modal`,
Escape, inerte no resto da página, navegação por seta, busca por digitação.

São semanas de detalhe, e é exatamente onde implementações caseiras falham —
sempre no teclado e no leitor de tela, que é quem mais depende disso.

Verificado em runtime: o Dialog prende o foco, fecha no Escape e **devolve o
foco ao gatilho**.

### Onde o produto tem identidade anterior ao sistema

Os símbolos de tipagem são os mesmos das cartas físicas do jogo. Não podiam
virar ícone genérico. A solução foi o sistema **acomodar** o símbolo:

```tsx
<TypeChip type="fire" icon={<TypeIcon type="fire" />} />
```

O token de cor continua governando fundo, borda e texto; o símbolo é do
produto. É a resposta para "e quando o design system encontra uma marca que já
existe?".

### `asChild` — um bug que vale contar

O `Button` aceita `asChild` para virar um `<a>` sem aninhar âncora dentro de
botão. A primeira versão fazia:

```tsx
<Slot {...props}>
  {startIcon}      {/* undefined */}
  {children}       {/* <a> */}
  {endIcon}        {/* false */}
</Slot>
```

O `Slot` do Radix exige **exatamente um** filho — ele funde as props nele. Três
filhos derrubavam a árvore inteira. A correção injeta os ícones *dentro* do
elemento filho via `cloneElement`, e há uma story cobrindo o caso para não
regredir.

---

## Direção visual

"Catálogo de história natural": papel marfim, tinta quente, verde botânico,
latão.

| Eixo | Antes | Depois |
|---|---|---|
| Superfície | Cor do tipo inundando o cartão | Papel; a cor vira pigmento |
| Borda | `24px solid` | Hairline de 1px + fio de 3px no topo |
| Cor de tipo | Fundo do cartão | Chip pequeno, halo sutil, tinta no valor |
| Tipografia | Sistema, bold em tudo | Fraunces (display) + Inter (UI) |
| Motion | Nenhuma | Transições curtas, easing tokenizado |

O acento é **verde**, não o vermelho da Pokédex, por dois motivos: o vermelho
brigaria com o token de perigo, e verde sobre marfim é a paleta de gabinete de
história natural que a interface persegue.

A escala tipográfica usa razão ~1.2 (terça menor), mais contida que a 1.25
usual — com serifada de display, saltos grandes ficam dramáticos demais para um
catálogo.

O Fraunces é variável e tem eixo de tamanho óptico (`opsz`): o desenho da letra
muda conforme o corpo, em vez de só escalar. É o que impede um título de 48px de
parecer um de 16px ampliado.

---

## Acessibilidade

Não é uma seção à parte do trabalho — está nos componentes:

- `:focus-visible` em vez de `:focus`, com um token único de anel;
- `prefers-reduced-motion` respeitado globalmente (não é preferência estética:
  para parte das pessoas, animação de interface provoca enjoo);
- `aria-busy` no botão em carregamento — sem isso, o spinner é informação
  exclusivamente visual;
- `<label>` real associado por `id` no `SearchField`. Placeholder não é rótulo:
  some quando a pessoa começa a digitar, justamente quando ela pode ter
  esquecido o que estava preenchendo;
- `role="alert"` na mensagem de erro, para ser anunciada ao aparecer;
- `<table>` semântica com `scope` — em `<div>` com grid, o leitor de tela ouve
  números sem saber a que coluna pertencem;
- `inert` na face virada da carta. O verso antigo era invisível para leitor de
  tela **e ainda assim alcançável por Tab** — o foco sumia para trás da carta;
- addon **a11y** no Storybook rodando axe-core em cada story.

---

## Se perguntarem

**"Por que três camadas e não duas?"**
Duas resolvem tema. A terceira resolve consistência entre componentes de uma
mesma família: sem ela, a altura do controle é repetida em Button, Input,
Select e SearchField, e os quatro divergem no primeiro ajuste.

**"Tailwind não é o oposto de design system?"**
Tailwind é o motor de utilitários; o sistema é a camada de token, que é nossa.
Com `--color-*: initial` a paleta padrão deixa de existir, então só os tokens
semânticos geram classe. O Tailwind vira a forma de *aplicar* o sistema, não de
contorná-lo.

**"Como você garante que a regra é seguida?"**
Não garanto por combinação. `lint:tokens` quebra o build em quatro classes de
violação, e o `--color-*: initial` faz o utilitário fora do sistema simplesmente
não renderizar.

**"Por que usou Radix em vez de escrever?"**
Porque o valor de um Dialog não está na aparência — está no gerenciamento de
foco, no `inert`, no Escape e no retorno do foco ao gatilho. Escrevo a
aparência, que é onde o design system agrega; não reescrevo acessibilidade que
já está resolvida e testada.

**"E se precisassem de um segundo tema de marca?"**
Editar `02-semantic.css`. Os componentes não mudam — é exatamente o que o tema
escuro já demonstra.
