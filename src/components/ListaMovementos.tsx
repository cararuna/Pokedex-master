import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../src/ListaMovimentos.css";

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
  pokemonName: string;
  pokemonMoves: IPokemonMove[];
}

const ListaMovementos = () => {
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

    // Mostra o botão "Previous" se não estivermos na primeira página
    setIsPreviousVisible(currentPage > 0);

    // Loga o objeto
    console.log(allLoadedData);
  };

  /*  useEffect(() => {
    loadPokemonPages(currentUrl);
  }, [currentPage]); */

  const handleNext = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevious = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  return (
    <>
      <Link to="/" className="buttons">
        <button className="footerButton">Back</button>
      </Link>
      <div className="pokemon-moves-list">
        <button onClick={handleNext} className="footerButton">
          Next
        </button>
        {isPreviousVisible && (
          <button onClick={handlePrevious} className="footerButton">
            Previous
          </button>
        )}
      </div>
    </>
  );
};

export default ListaMovementos;
