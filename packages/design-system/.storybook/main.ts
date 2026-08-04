import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  /**
   * As stories do aplicativo entram junto, e isso não é conveniência.
   *
   * Um design system só prova alguma coisa montado no produto. Enquanto a
   * vitrine mostrava apenas o pacote, ela divergiu do que a tela realmente
   * fazia — a carta do jogo aparecia como um cartão genérico, e o símbolo de
   * tipagem do tabuleiro nem existia aqui. Incluir `apps/web` faz o Storybook
   * carregar o **componente de produção**, com os mesmos imports: se a carta
   * mudar, a vitrine muda junto, sem ninguém lembrar de atualizar.
   */
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx)",
    "../../../apps/web/src/**/*.stories.@(ts|tsx)",
  ],

  addons: [
    "@storybook/addon-docs",
    // Roda axe-core em cada story e mostra as violações num painel.
    // Deixa a acessibilidade visível durante o desenvolvimento, em vez de
    // virar auditoria depois — que é quando já custa caro corrigir.
    "@storybook/addon-a11y",
  ],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  // O Storybook tem o próprio pipeline Vite, separado do app. Sem registrar
  // o Tailwind aqui, o CSS do design system carrega sem nenhum utilitário.
  viteFinal: (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    return config;
  },
};

export default config;
