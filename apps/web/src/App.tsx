import { useState } from "react";
import { Context } from "./components/GlobalContext";
import { IPokemon } from "./types/pokemon";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@pokedex/design-system";
import { Favorites } from "./pages/Favorites";
import { DesignSystemPage } from "./pages/DesignSystem";
import MovimentosCompletos from "./components/MovimentosCompletos";

export default function App() {
  const [favorites, setFavorites] = useState<IPokemon[]>([]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Context.Provider value={{ favorites, setFavorites }}>
          <Routes>
            <Route path="/" element={<MovimentosCompletos />} />
            <Route path="/favorites" element={<Favorites />} />
            {/* Vitrine do design system. Na Fase 3 a rota "/" passa a usar
                estes componentes e esta página vira só referência. */}
            <Route path="/design-system" element={<DesignSystemPage />} />
          </Routes>
        </Context.Provider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
