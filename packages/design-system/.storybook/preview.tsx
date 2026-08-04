import type { Preview, Decorator } from "@storybook/react-vite";
import { useEffect } from "react";
import { TooltipProvider } from "../src/components/Tooltip";
import "../src/styles/index.css";

/**
 * Alterna o tema pelo seletor da barra de ferramentas.
 *
 * Escreve `data-theme` no <html> — o mesmo gancho que a camada semântica usa.
 * Nenhum componente recebe prop de tema: se algum precisasse, seria sinal de
 * que ele está lendo primitivo em vez de token semântico.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? "light";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <TooltipProvider>
      <div className="bg-surface p-8 text-text">
        <Story />
      </div>
    </TooltipProvider>
  );
};

const preview: Preview = {
  decorators: [withTheme],

  globalTypes: {
    theme: {
      description: "Tema do design system",
      toolbar: {
        title: "Tema",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Claro" },
          { value: "dark", icon: "moon", title: "Escuro" },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: { theme: "light" },

  parameters: {
    layout: "fullscreen",

    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },

    a11y: {
      // "todo" reporta as violações sem derrubar o build. Vira "error" quando
      // o conjunto estiver limpo — aí a regressão passa a falhar em CI.
      test: "todo",
    },

    docs: {
      toc: true,
    },

    options: {
      // Ordem de leitura: fundamentos antes de componentes. Quem abre o
      // Storybook pela primeira vez precisa entender os tokens para que as
      // decisões dos componentes façam sentido.
      storySort: {
        order: [
          "Fundamentos",
          ["Introdução", "Cor", "Tipografia", "Espaço e forma", "Movimento"],
          "Componentes",
          "Layout",
        ],
      },
    },
  },
};

export default preview;
