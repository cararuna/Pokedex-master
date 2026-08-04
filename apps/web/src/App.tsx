import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@pokedex/design-system";
import { PokedexPage } from "./features/pokedex/PokedexPage";

/**
 * O aplicativo tem uma tela só: a mesa de consulta.
 *
 * Existia também uma `/design-system`, feita à mão para mostrar os
 * componentes. Ela saiu porque era uma segunda fonte de verdade: mostrava o
 * sistema como alguém *escreveu* que ele era, e não como ele de fato é usado.
 * Toda divergência entre as duas versões era invisível até alguém comparar.
 *
 * A vitrine agora é o Storybook, que monta os componentes de verdade a partir
 * do pacote. Se um componente mudar, a vitrine muda junto — sem ninguém
 * lembrar de atualizar.
 */
export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PokedexPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
