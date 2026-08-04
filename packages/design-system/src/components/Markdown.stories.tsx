import type { Meta, StoryObj } from "@storybook/react-vite";
import { Markdown } from "./Markdown";

const RESPOSTA_REAL = `
Pokémon that learn a **fire** attack with value **10**:

| Pokémon | Attack | Types |
| --- | --- | --- |
| Charmander | Flare Blitz | fire |
| Charizard | Heat Wave | fire/flying |
| Magmar | Fire Blast | fire |

There are **30** in total — these are the first three by number.
`.trim();

const COBERTURA = `
## Headings

Paragraphs join broken lines into a
single block, the way a model streams them.

### Lists

- **Bold** inside an item
- \`code\` inside an item
- A [link](https://example.com) inside an item
  - one nested level

1. Ordered
2. Also ordered

### Code

\`\`\`sql
select slug, game_power
from pokemon_moves
where move_type = 'fire';
\`\`\`

> A quote, for when the model cites a rule.

---

Inline: **bold**, *italic*, \`code\`, and [a link](https://example.com).
`.trim();

const HOSTIL = `
Text with <script>alert('x')</script> inline and a [bad link](javascript:alert(1)).

An unclosed code fence, as in an interrupted stream:

\`\`\`
select 1
`.trim();

const meta = {
  title: "Componentes/Markdown",
  component: Markdown,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Renderiza o Markdown que o agente devolve, com os tokens do sistema.",
          "",
          "**Por que não `react-markdown`.** Duas razões, e a segunda é a que",
          "importa. A primeira é peso: react-markdown mais remark-gfm passam de",
          "40 kB gzip para cobrir uma especificação inteira, quando o que chega",
          "aqui é o subconjunto que um modelo de linguagem produz.",
          "",
          "A segunda é que o resultado precisa **ser** do design system. Com a",
          "biblioteca, cada elemento vira um `components={{ h1: …, li: … }}` de",
          "override e a estilização fica pendurada por fora. Aqui cada bloco nasce",
          "com o token semântico certo, e o `Markdown` é um componente do sistema",
          "como qualquer outro — com story, com tema claro e escuro.",
          "",
          "**Segurança.** Nenhum `dangerouslySetInnerHTML`: o texto vira elemento",
          "React e o React escapa tudo. HTML dentro do Markdown aparece como",
          "texto, que é o comportamento correto para conteúdo vindo de um modelo.",
          "O `href` é filtrado por esquema — `javascript:` não vira link.",
        ].join("\n"),
      },
    },
  },
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RespostaDoAgente: Story = {
  name: "Resposta do agente",
  parameters: {
    docs: {
      description: {
        story:
          "Saída real do agente para “Who learns a fire attack with value 10?”. Antes deste componente, os `**` apareciam crus e a tabela chegava como linhas de pipe.",
      },
    },
  },
  args: { children: RESPOSTA_REAL },
};

export const Cobertura: Story = {
  name: "Tudo que ele entende",
  parameters: {
    docs: {
      description: {
        story: [
          "Títulos, parágrafos, listas ordenadas e não ordenadas com um nível de",
          "aninhamento, bloco de código cercado, citação, régua, tabela e os",
          "trechos de linha: negrito, itálico, código e link.",
          "",
          "É deliberadamente menos do que o CommonMark. O escopo é *o que um",
          "modelo escreve*, não *o que a especificação permite* — e cada",
          "construção a mais é código que precisa ser mantido e testado.",
        ].join("\n"),
      },
    },
  },
  args: { children: COBERTURA },
};

export const EntradaHostil: Story = {
  name: "Entrada hostil",
  parameters: {
    docs: {
      description: {
        story: [
          "Três coisas acontecem aqui, e todas de propósito:",
          "",
          "1. A tag `<script>` aparece **como texto**. Nunca é executada, porque",
          "   nada neste componente escreve HTML — o React escapa.",
          "2. O link `javascript:` perde o `href` e sobra só o rótulo.",
          "3. O bloco de código sem fechamento é renderizado até o fim do texto,",
          "   em vez de derrubar o resto. Importa porque a resposta chega por",
          "   streaming: metade de um bloco é o estado normal enquanto digita.",
        ].join("\n"),
      },
    },
  },
  args: { children: HOSTIL },
};
