import React, { useEffect, useState } from "react";
import { Context } from "./components/GlobalContext";
import { IPokemon } from "./types/pokemon";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Home } from "./pages/Home";
import { Favorites } from "./pages/Favorites";
import ListaMovementos from "./components/ListaMovementos";
import MovimentosCompletos from "./components/MovimentosCompletos";

export default function App() {
  const [favorites, setFavorites] = useState<IPokemon[]>([]);

  /* useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch("https://localhost:7198/Favorites");
        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }
        const data = await response.json();

        const pokemonIds = data.map(
          (item: { pokemonId: number }) => item.pokemonId
        );

        const favoritePokemons = await Promise.all(
          pokemonIds.map(async (id: any) => {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const pokemonData = await res.json();
            return pokemonData;
          })
        );

        setFavorites(favoritePokemons);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, []); */

  return (
    <BrowserRouter>
      <Context.Provider value={{ favorites, setFavorites }}>
        <Switch>
          <Route path="/" exact component={MovimentosCompletos} />{" "}
          {/* rota trocada para de Home para MovimentosCompletos temporariamente */}
          <Route path="/favorites" exact component={Favorites} />
          <Route
            path="/listaMovementos"
            exact
            component={MovimentosCompletos}
          />
        </Switch>
      </Context.Provider>
    </BrowserRouter>
  );
}
