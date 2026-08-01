import { useState } from "react";
import { Context } from "./components/GlobalContext";
import { IPokemon } from "./types/pokemon";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Favorites } from "./pages/Favorites";
import MovimentosCompletos from "./components/MovimentosCompletos";

export default function App() {
  const [favorites, setFavorites] = useState<IPokemon[]>([]);

  return (
    <BrowserRouter>
      <Context.Provider value={{ favorites, setFavorites }}>
        <Routes>
          <Route path="/" element={<MovimentosCompletos />} />
          <Route path="/favorites" element={<Favorites />} />
        </Routes>
      </Context.Provider>
    </BrowserRouter>
  );
}
