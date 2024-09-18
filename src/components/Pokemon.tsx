import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faEye,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useState } from "react";
import Modal from "react-modal";
import { IPokemon, IPokemonData } from "../types/pokemon";
import { Context } from "./GlobalContext";

interface IPokemonProps {
  pokemon: IPokemon;
}

const Pokemon = ({ pokemon }: IPokemonProps) => {
  const { favorites, setFavorites } = useContext(Context);
  const [pokemonData, setPokemonData] = useState<IPokemonData>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [wasSeen, setWasSeen] = useState(false);
  const [wasCaught, setWasCaught] = useState(false);

  const [modalIsOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (pokemon.url) {
      const loadImgPokemon = async () => {
        const response = await fetch(pokemon.url);
        const data: IPokemonData = await response.json();

        // Verifica se o Pokémon é favorito
        const isFav = favorites.some((fav) => fav.id === data.id);
        setIsFavorite(isFav);

        // Atualiza os dados do Pokémon, mas sem os movimentos ainda
        setPokemonData({
          ...data,
          isFavorite: isFav,
        });
      };
      loadImgPokemon();
    } else {
      const isFav = favorites.some((fav) => fav.id === pokemon.id);
      setIsFavorite(isFav);
      setPokemonData({ ...pokemon, isFavorite: isFav } as IPokemonData);
    }
  }, [pokemon.url, favorites]);

  function handleOpenModal() {
    if (pokemonData) {
      const loadMoves = async () => {
        const moveTypesMap: {
          [key: string]: { moveName: string; power: number };
        } = {};

        for (const move of pokemonData.moves) {
          const isLevelUp = move.version_group_details.some(
            (detail) => detail.move_learn_method.name === "level-up"
          );

          if (isLevelUp) {
            const moveResponse = await fetch(move.move.url);
            const moveData = await moveResponse.json();

            if (moveData.power && moveData.power > 0) {
              const moveType = moveData.type.name;
              const moveName = moveData.name;
              const adjustedPower = Math.ceil(moveData.power / 10);

              if (
                !moveTypesMap[moveType] ||
                moveTypesMap[moveType].power < adjustedPower
              ) {
                moveTypesMap[moveType] = { moveName, power: adjustedPower };
              }
            }
          }
        }

        for (const [moveType, { moveName, power }] of Object.entries(
          moveTypesMap
        )) {
          console.log(
            `Tipo: ${moveType}, Movimento: ${moveName}, Power: ${power}`
          );
        }

        const moveTypesArray: string[] = Object.entries(moveTypesMap).map(
          ([type, { moveName, power }]) =>
            `${moveName} (${type} - ${power} power)`
        );

        setPokemonData((prevData) =>
          prevData ? { ...prevData, moveTypes: moveTypesArray } : undefined
        );
      };

      loadMoves();
    }

    setIsOpen(true);
  }

  function handleCloseModal() {
    setIsOpen(false);
  }

  async function handleFavoriteClick() {
    if (pokemonData) {
      const pokemonId = pokemonData.id;
      if (isFavorite) {
        await handleDeleteRequest(pokemonId);
        setIsFavorite(false);
        setFavorites(favorites.filter((fav) => fav.id !== pokemonId));
      } else {
        await handlePostRequest(pokemonId);
        setIsFavorite(true);
        setFavorites([...favorites, pokemonData]);
      }
    }
  }

  async function handleSeenClick() {
    if (pokemonData) {
      const pokemonId = pokemonData.id;
      if (wasSeen) {
        await handleDeleteRequest(pokemonId);
        setIsFavorite(false);
        setFavorites(favorites.filter((fav) => fav.id !== pokemonId));
      } else {
        await handlePostRequest(pokemonId);
        setIsFavorite(true);
        setFavorites([...favorites, pokemonData]);
      }
    }
  }

  async function handleCaughtClick() {
    if (pokemonData) {
      const pokemonId = pokemonData.id;
      if (isFavorite) {
        await handleDeleteRequest(pokemonId);
        setIsFavorite(false);
        setFavorites(favorites.filter((fav) => fav.id !== pokemonId));
      } else {
        await handlePostRequest(pokemonId);
        setIsFavorite(true);
        setFavorites([...favorites, pokemonData]);
      }
    }
  }

  const handlePostRequest = async (pokemonId: number) => {
    const url = "https://localhost:7198/Favorites";
    const body = {
      userId: 5,
      pokemonId: pokemonId,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteRequest = async (pokemonId: number) => {
    const url = `https://localhost:7198/Favorites`;
    const body = {
      userId: 5,
      pokemonId: pokemonId,
    };

    try {
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <>
      {pokemonData && (
        <li className="pokeListContainer">
          <button className="poke" id={pokemonData.types[0].type.name}>
            <div>
              <img
                onClick={handleOpenModal}
                className={pokemonData.types[0].type.name}
                src={pokemonData.sprites?.front_default}
                alt={pokemonData.name}
              />
            </div>
            <div className="containerPokeButton">
              <p className="topPokeButton">
                <div className="numberPokemon">Nº {pokemonData.id}</div>

                <div id="buttonFavorite" onClick={handleFavoriteClick}>
                  <FontAwesomeIcon
                    icon={faStar}
                    color={isFavorite ? "gold" : "white"}
                  />
                </div>
                <div id="buttonFavorite" onClick={handleSeenClick}>
                  <FontAwesomeIcon
                    icon={faEye}
                    color={isFavorite ? "gold" : "white"}
                  />
                </div>
                <div id="buttonFavorite" onClick={handleCaughtClick}>
                  <FontAwesomeIcon
                    icon={faCheckCircle}
                    color={isFavorite ? "gold" : "white"}
                  />
                </div>
              </p>
              <h1 className="title" onClick={handleOpenModal}>
                {pokemonData.name}{" "}
              </h1>
              <div className="typeMap">
                {pokemonData?.types?.map(({ type }) => (
                  <span key={type.name} className={type.name}>
                    {type.name}{" "}
                  </span>
                ))}
              </div>
            </div>
          </button>
          <Modal
            className="modal"
            isOpen={modalIsOpen}
            onRequestClose={handleCloseModal}
          >
            <div className="modal-container">
              <div
                className="left-container"
                id={pokemonData.types[0].type.name}
              >
                <div className="pokeImg">
                  <img
                    src={pokemonData.sprites?.front_default}
                    alt={pokemonData.name}
                  />
                </div>
              </div>
              <div className="right-container">
                <div className="modalTitulo">
                  <h1 className="title">
                    {pokemonData.name} #{pokemonData.id}
                  </h1>
                </div>
                <div className="typeModal">
                  {pokemonData?.types?.map(({ type }) => (
                    <span key={type.name} className={type.name}>
                      {type.name}{" "}
                    </span>
                  ))}
                </div>
                <ul className="info">
                  <div>
                    Abilities{" "}
                    <div>
                      {pokemonData?.abilities?.map(({ ability }) => (
                        <li key={ability.name} className="pokeAbility">
                          {ability.name}{" "}
                        </li>
                      ))}
                    </div>
                  </div>
                  <div>
                    Weight
                    <div className="pokeWeight">
                      {pokemonData.weight / 10} Kg
                    </div>{" "}
                  </div>
                </ul>
                <div className="stats">
                  {pokemonData?.stats?.map(({ stat, base_stat }) => (
                    <div key={stat.name} className={stat.name}>
                      <span className="progress">{stat.name}</span>
                      <ul className="progress-value"></ul>
                      <ul className="progres-name">{base_stat}</ul>
                    </div>
                  ))}
                </div>
                <div className="info">
                  <h2>Movimentos:</h2>
                  <ul>
                    {pokemonData.moveTypes?.map((move, index) => (
                      <li key={index} className="pokeMoves">
                        {move}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Modal>
        </li>
      )}
    </>
  );
};

export default Pokemon;
