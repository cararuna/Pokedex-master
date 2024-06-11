import { useState, useEffect, useContext } from "react";
import { IPokemon } from "../../../types/pokemon";
import { Context } from "../../../components/GlobalContext";

interface IData {
  id: number;
  userId: number;
  pokemonId: number;
}

const firstUrl = "https://pokeapi.co/api/v2/pokemon";

export const useFavorites = () => {
  const { favorites, setFavorites } = useContext(Context);
  const [pokemons, setPokemons] = useState<IPokemon[]>([]);

  const loadPokemonList = (url: string) => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setPokemons(data.results);
      });
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch("https://localhost:7198/Favorites");
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      const data = await response.json();

      const pokemonIds = data.map((item: IData) => item.pokemonId);

      const favoritePokemons = await Promise.all(
        pokemonIds.map(async (id: number) => {
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

  useEffect(() => {
    loadPokemonList(firstUrl);
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [setFavorites]);

  return { pokemons, favorites };
};
