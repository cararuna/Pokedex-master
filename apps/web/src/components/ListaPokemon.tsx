import { useState } from "react";
import { IPokemon } from "../types/pokemon";
import "../ListaPokemon.css";
import Pokemon from "./Pokemon";
import { Link } from "react-router-dom";

interface Props {
  loadNextPage?: () => void;
  loadPreviousPage?: () => void;
  list: IPokemon[];
  isFavoritePage?: boolean;
}

export default function ListaPokemon({
  loadNextPage,
  loadPreviousPage,
  list,
  isFavoritePage,
}: Props) {
  const [flippedPokemonName, setFlippedPokemonName] = useState<string | null>(
    null
  );

  const handleFlip = (pokemonName: string) => {
    setFlippedPokemonName((prev) =>
      prev === pokemonName ? null : pokemonName
    );
  };

  return (
    <div className="principalPage">
      {isFavoritePage ? (
        <Link to="/" className="buttons">
          <button className="footerButton">Back</button>
        </Link>
      ) : (
        <div className="buttons">
          <button onClick={loadPreviousPage} className="footerButton">
            Previous
          </button>
          <button onClick={loadNextPage} className="footerButton">
            Next
          </button>
        </div>
      )}

      <div className="containerList">
        <div className="pokeMap">
          {list.map((pokemon) => (
            <Pokemon
              key={pokemon.name}
              pokemon={pokemon}
              isFlipped={flippedPokemonName === pokemon.name}
              onFlip={handleFlip}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
