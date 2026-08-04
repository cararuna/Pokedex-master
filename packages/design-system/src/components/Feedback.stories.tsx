import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { EmptyState, Pagination, StatBar } from "./Feedback";
import { Stack } from "../primitives/Layout";

/**
 * `component` fica de fora de propósito: este arquivo documenta três
 * componentes, e amarrar o meta a um deles faria o TypeScript exigir os `args`
 * do `EmptyState` em toda story — inclusive nas que só mostram `Pagination`.
 */
const meta: Meta = {
  title: "Componentes/Feedback",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: [
          "Três peças que respondem à mesma pergunta — *o que está acontecendo?* —",
          "e por isso moram juntas: `EmptyState`, `StatBar` e `Pagination`.",
        ].join("\n"),
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Vazio: Story = {
  name: "EmptyState",
  parameters: {
    docs: {
      description: {
        story: [
          "**Vazio não é erro, e os dois não podem parecer iguais.** Uma busca sem",
          "resultado é uma resposta legítima; uma API fora do ar é um defeito. Se",
          "as duas telas forem idênticas, quem usa não sabe se muda o filtro ou",
          "chama alguém.",
          "",
          "Por isso `action` é opcional mas quase sempre certa: o estado vazio",
          "deve oferecer a saída, não só constatar o beco.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Stack gap={6}>
      <EmptyState
        title="No Pokémon found"
        description='Nothing matches "charizrd".'
        action={{ label: "Clear filters", onClick: () => {} }}
      />
      <EmptyState
        title="Could not load"
        description="The API is not responding. Start it with `pnpm dev:api`."
        action={{ label: "Try again", onClick: () => {} }}
      />
    </Stack>
  ),
};

export const Barra: Story = {
  name: "StatBar",
  parameters: {
    docs: {
      description: {
        story: [
          "**O rótulo e o número são texto; a barra é `aria-hidden`.** Não há",
          "`role=\"meter\"` aqui, e a ausência é a decisão: com o valor já escrito",
          "ao lado, um `meter` faria o leitor de tela anunciar a mesma informação",
          "duas vezes — uma como texto, outra como medidor.",
          "",
          "A barra existe para comparação entre linhas, que é uma tarefa visual.",
          "Quem não a enxerga não perde nada, porque o número está lá; quem a",
          "enxerga compara sem ler número nenhum. Cada um recebe a forma que",
          "serve — e não a mesma coisa duas vezes.",
        ].join("\n"),
      },
    },
  },
  render: () => (
    <Stack gap={4} className="max-w-sm">
      <StatBar label="Heat Wave" value={10} max={10} />
      <StatBar label="Dragon Breath" value={8} max={10} />
      <StatBar label="Bug Buzz" value={9} max={10} />
    </Stack>
  ),
};

export const Paginas: Story = {
  name: "Pagination",
  parameters: {
    docs: {
      description: {
        story: [
          "`<nav aria-label>` de verdade, com a página atual marcada por",
          "`aria-current=\"page\"` — sem isso, a única pista de onde se está é a",
          "cor, que não chega a quem navega por áudio.",
          "",
          "Os botões de anterior e próxima ficam **desabilitados**, e não",
          "ocultos, nos extremos: controle que aparece e some faz a fileira",
          "deslocar a cada página, e o alvo de clique muda de lugar embaixo do",
          "ponteiro.",
        ].join("\n"),
      },
    },
  },
  render: () => {
    const [p, setP] = useState(1);
    return (
      <Stack gap={6}>
        <Pagination page={p} totalPages={17} onPageChange={setP} />
        <p className="font-mono text-xs text-text-subtle">page = {p}</p>
      </Stack>
    );
  },
};

export const PaginaUnica: Story = {
  name: "Página única",
  parameters: {
    docs: {
      description: {
        story:
          "Com uma página só não há navegação a oferecer, e o componente não renderiza nada. Mostrar “1 de 1” com duas setas mortas é ruído.",
      },
    },
  },
  render: () => (
    <Stack gap={2}>
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />
      <p className="font-mono text-xs text-text-subtle">
        (nada acima — é o comportamento correto)
      </p>
    </Stack>
  ),
};
