import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../ListaMovimentos.css";

interface IPokemon {
  name: string;
  url: string;
}

interface IPokemonDetails {
  name: string;
  moveTypes: string[];
}

interface ILocationState {
  list: IPokemon[];
}

const ListaMovementos = () => {
  const location = useLocation();
  const state = (location.state as ILocationState) || { list: [] }; // Tipagem do estado
  const [pokemonData, setPokemonData] = useState<IPokemonDetails[]>([]);

  useEffect(() => {
    if (state.list.length > 0) {
      const fetchPokemonData = async () => {
        const pokemonDetails = await Promise.all(
          state.list.map(async (pokemon: IPokemon) => {
            const response = await fetch(pokemon.url);
            const data = await response.json();

            const moveTypesMap: Record<
              string,
              { moveName: string; power: number }
            > = {};

            for (const move of data.moves) {
              const isLevelUp = move.version_group_details.some(
                (detail: any) => detail.move_learn_method.name === "level-up"
              );

              if (isLevelUp) {
                const moveResponse = await fetch(move.move.url);
                const moveData = await moveResponse.json();

                if (moveData.power && moveData.power > 0) {
                  const moveType = moveData.type.name;
                  const moveName = moveData.name;
                  let adjustedPower = Math.ceil(moveData.power / 10);

                  // Limita o power a 10
                  if (adjustedPower > 10) {
                    adjustedPower = 10;
                  }

                  // Define o valor mínimo de power como 6
                  if (adjustedPower < 6) {
                    adjustedPower = 6;
                  }

                  // Arredonda para os valores permitidos (6, 8, 9, 10)
                  if (adjustedPower === 7) {
                    adjustedPower = 8;
                  }

                  if (
                    !moveTypesMap[moveType] ||
                    moveTypesMap[moveType].power < adjustedPower
                  ) {
                    moveTypesMap[moveType] = { moveName, power: adjustedPower };
                  }
                }
              }
            }

            const moveTypesArray = Object.entries(moveTypesMap).map(
              ([type, { moveName, power }]) =>
                `${moveName} (${type} - ${power} power)`
            );

            return {
              name: data.name,
              moveTypes: moveTypesArray,
            };
          })
        );
        setPokemonData(pokemonDetails);
      };

      fetchPokemonData();
    }
  }, [state.list]);

  return (
    <>
      <Link to="/" className="buttons">
        <button className="footerButton">Back</button>
      </Link>
      <div className="pokemon-moves-list">
        {pokemonData.map((pokemon, index) => (
          <div key={index} className="pokemon-move">
            <h2>{pokemon.name}</h2>
            <ul>
              {pokemon.moveTypes.map((move, moveIndex) => (
                <li key={moveIndex} className="pokeMoves">
                  {move}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
};

export default ListaMovementos;
