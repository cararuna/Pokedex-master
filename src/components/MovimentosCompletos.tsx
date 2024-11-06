import React, { useState, useEffect } from "react";
import "../../src/ListaMovimentos.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import PokemonMove from "./PokemonMove";
import Search from "./Search";

const firstUrl = "https://pokeapi.co/api/v2/pokemon";
const maxPokemonIndex = 387; //387

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
  pokemonType: string;
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
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const [inputTextState, setInputTextState] = useState("");
  const [selectValue, setSelectValue] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          pokemonType: data.types[0].type.name,
          pokemonMoves,
          pokemonSprite:
            data.sprites.versions?.["generation-iv"]?.["diamond-pearl"]
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
    let allLoadedData: IPokemonDetails[] = [];

    setLoading(true); // Ativa o loading

    while (currentLoadUrl) {
      const response = await fetch(currentLoadUrl);
      const data = await response.json();

      const pokemonDetails = await fetchPokemonDetails(
        data.results,
        allLoadedData.length
      );

      allLoadedData = [...allLoadedData, ...pokemonDetails];
      currentLoadUrl = data.next;

      if (allLoadedData.length >= maxPokemonIndex) {
        break;
      }
    }

    setAllPokemonData(allLoadedData);
    setIsPreviousVisible(currentPage > 0);
    setLoading(false); // Desativa o loading após o carregamento
  };

  useEffect(() => {
    loadPokemonPages(currentUrl);
  }, [currentPage]);

  const hasSelect = true;

  const placeholder = "Procure pelo Nome do Pokémon";

  // Função para atualizar o texto do input
  const handleSearchChange = (text: string) => {
    setInputTextState(text);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const showButtonAt = window.innerHeight * 1;
      setShowScrollButton(scrollPosition > showButtonAt);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="MovimentosCompletos">
      <Search
        hasSelect={hasSelect}
        setInputText={handleSearchChange}
        setSelectValue={setSelectValue}
        placeholder={placeholder}
      />
      {!loading ? (
        <div className="pokemonMovesContainer">
          {allPokemonData
            .filter((pokemon) => {
              // Aplica o filtro apenas se inputText não estiver vazio
              if (inputTextState === "" && selectValue === "") return true; // Se ambos estiverem vazios, retornar todos

              const nameMatches = pokemon.pokemonName
                .toLowerCase()
                .includes(inputTextState.toLowerCase());

              // Se selectValue não estiver vazio, verifica os movimentos
              const typeMatches =
                selectValue === "" ||
                pokemon.pokemonMoves.some(
                  (move) =>
                    move.moveType.toLowerCase() === selectValue.toLowerCase()
                );

              // Retorna verdadeiro se corresponder ao nome e/ou tipo de movimento
              return nameMatches && typeMatches;
            })
            .map((pokemon, index) => (
              <PokemonMove
                key={index}
                number={pokemon.pokemonNumber}
                name={pokemon.pokemonName}
                pokemonType={pokemon.pokemonType}
                moves={pokemon.pokemonMoves}
                sprites={pokemon.pokemonSprite}
              />
            ))}
        </div>
      ) : (
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Carregando Lista de Pokémons e seus golpes...</p>
        </div>
      )}
      {showScrollButton && (
        <button onClick={scrollToTop} className="scroll-to-top-button">
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      )}
    </div>
  );
};

export default MovimentosCompletos;
