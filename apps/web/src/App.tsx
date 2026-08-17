import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@pokedex/design-system";
import { PokedexPage } from "./features/pokedex/PokedexPage";
import { ChangesPage } from "./features/changes/ChangesPage";

/**
 * Duas telas: a mesa de consulta e o inbox de mudanças.
 *
 * `/changes` não aparece na navegação de propósito. Não é segurança — quem
 * decide o que cada pessoa pode fazer é o servidor, a cada rota — é público
 * certo: quem senta para jogar quer a mesa, e um link para "aprovar mudanças"
 * no cabeçalho seria uma porta que quase ninguém deve abrir ocupando o lugar
 * de uma que todos usam.
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
          <Route path="/changes" element={<ChangesPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
