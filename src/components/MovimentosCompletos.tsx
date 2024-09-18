import React, { useState, useEffect } from "react";
import "../../src/ListaMovimentos.css";

import PokemonMove from "./PokemonMove";

const firstUrl = "https://pokeapi.co/api/v2/pokemon";
const maxPokemonIndex = 387;
const pagesPerLoad = 7;
const pokemonsPerPage = 20;

interface IPokemon {
  name: string;
  url: string;
}

interface IPokemonMove {
  attackName: string;
  moveType: string;
  power: number;
}

interface IPokemonDetails {
  pokemonNumber: number;
  pokemonSprite: string;
  pokemonName: string;
  pokemonMoves: IPokemonMove[];
}

const MovimentosCompletos = () => {
  const [allPokemonData, setAllPokemonData] = useState<IPokemonDetails[]>([]);
  const [currentUrl, setCurrentUrl] = useState<string | null>(firstUrl);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPreviousVisible, setIsPreviousVisible] = useState(false);

  const fetchPokemonDetails = async (
    pokemonList: IPokemon[],
    startIndex: number
  ) => {
    const pokemonDetails = await Promise.all(
      pokemonList.map(async (pokemon, index) => {
        const pokemonIndex = startIndex + index;

        if (pokemonIndex > maxPokemonIndex) {
          return null;
        }

        const response = await fetch(pokemon.url);
        const data = await response.json();
        console.log(response);
        console.log(data);

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

              if (adjustedPower > 10) {
                adjustedPower = 10;
              }

              if (adjustedPower <= 6) {
                adjustedPower = 8;
              }

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

        const pokemonMoves = Object.entries(moveTypesMap).map(
          ([type, { moveName, power }]) => ({
            attackName: moveName,
            moveType: type,
            power: power,
          })
        );

        return {
          pokemonNumber: pokemonIndex + 1,
          pokemonName: data.name,
          pokemonMoves,
          pokemonSprite:
            data.sprites.versions?.["generation-iii"]?.["firered-leafgreen"]
              .front_default,
        };
      })
    );

    return pokemonDetails.filter(
      (pokemon): pokemon is IPokemonDetails => pokemon !== null
    );
  };

  const loadPokemonPages = async (url: string | null) => {
    if (!url) return;

    let currentLoadUrl = url;
    let currentLoadPage = 0;
    let allLoadedData: IPokemonDetails[] = [];

    while (currentLoadUrl && currentLoadPage < pagesPerLoad) {
      const response = await fetch(currentLoadUrl);
      const data = await response.json();
      const pokemonDetails = await fetchPokemonDetails(
        data.results,
        currentPage * pagesPerLoad * pokemonsPerPage +
          currentLoadPage * pokemonsPerPage
      );
      allLoadedData = [...allLoadedData, ...pokemonDetails];
      currentLoadUrl = data.next;
      currentLoadPage++;
    }

    setAllPokemonData(allLoadedData);
    setCurrentUrl(currentLoadUrl);
    setIsPreviousVisible(currentPage > 0);

    console.log(allLoadedData); // Loga o objeto final
  };

  useEffect(() => {
    loadPokemonPages(currentUrl);
  }, [currentPage]);

  const handleNext = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevious = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  return (
    <>
      {allPokemonData.map((pokemon, index) => (
        <PokemonMove
          key={index}
          number={pokemon.pokemonNumber}
          name={pokemon.pokemonName}
          moves={pokemon.pokemonMoves}
          sprites={pokemon.pokemonSprite}
        />
      ))}
    </>
  );
};

export default MovimentosCompletos;
