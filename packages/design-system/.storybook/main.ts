import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],

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
