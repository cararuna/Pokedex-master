import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@pokedex/design-system";
import { PokedexPage } from "./features/pokedex/PokedexPage";
import { DesignSystemPage } from "./pages/DesignSystem";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PokedexPage />} />
          <Route path="/design-system" element={<DesignSystemPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
