import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ListaPokemon from "../../components/ListaPokemon";
import Search from "../../components/Search";
import { IPokemon } from "../../types/pokemon";
import "../Home/index.css";
import "../../ListaPokemon.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
const firstUrl = "https://pokeapi.co/api/v2/pokemon";
const typeUrl = "https://pokeapi.co/api/v2/type/";

interface IData {
  id: number;
  userId: number;
  pokemonId: number;
}

export const Home = () => {
  const [pokemons, setPokemons] = useState([] as IPokemon[]);

  const [nextUrl, setNextUrl] = useState("");
  const [previousUrl, setPreviousUrl] = useState("");
  const [inputText, setInputText] = useState("");
  const [selectValue, setSelectValue] = useState("");

  const loadPreviousPage = () => {
    loadPokemonList(previousUrl);
  };

  const loadNextPage = () => {
    loadPokemonList(nextUrl);
  };

  const loadPokemonList = (url: string) => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setPokemons(data.results);
        setNextUrl(data.next);
        setPreviousUrl(data.previous);
      });
  };

  const loadPokemonListByType = (type: string) => {
    fetch(typeUrl + type)
      .then((res) => res.json())
      .then((data) => {
        setPokemons(
          data.pokemon.reduce(
            (acc: IPokemon[], current: { pokemon: IPokemon }) => [
              ...acc,
              current.pokemon,
            ],
            [] as IPokemon[]
          )
        );
      });
  };

  useEffect(() => {
    if (selectValue !== "") {
      loadPokemonListByType(selectValue);
    } else {
      loadPokemonList(firstUrl);
    }
  }, [selectValue]);

  useEffect(() => {
    loadPokemonList(firstUrl);

    const fetchFavorites = async () => {
      try {
        const response = await fetch("https://localhost:7198/Favorites");
        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText);
        }
        const data = await response.json();

        const pokemonIds = data.map((item: IData) => item.pokemonId);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, []);

  return (
    <div className="container">
      <Search setSelectValue={setSelectValue} setInputText={setInputText} />
      <Link to="/favorites" className="buttonsFav">
        <button>
          <FontAwesomeIcon icon={faStar} style={{ color: "gold" }} />
        </button>
      </Link>
      <ListaPokemon
        list={pokemons.filter((pokemon) => pokemon.name.includes(inputText))}
        loadPreviousPage={loadPreviousPage}
        loadNextPage={loadNextPage}
      />
    </div>
  );
};
