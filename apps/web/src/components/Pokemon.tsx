import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faEye,
  faCheckCircle,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useState } from "react";
import Modal from "react-modal";
import { IPokemon, IPokemonData } from "../types/pokemon";
import { Context } from "./GlobalContext";
import { typeTalentTrees, innateAbilities, getTypeIcon } from "../data/talentTrees";

interface IPokemonProps {
  pokemon: IPokemon;
  isFlipped: boolean;
  onFlip: (pokemonName: string) => void;
}

const Pokemon = ({ pokemon, isFlipped, onFlip }: IPokemonProps) => {
  const { favorites, setFavorites } = useContext(Context);
  const [pokemonData, setPokemonData] = useState<IPokemonData>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [wasSeen] = useState(false);

  const [modalIsOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (pokemon.url) {
      const loadImgPokemon = async () => {
        const response = await fetch(pokemon.url);
        const data: IPokemonData = await response.json();

        const isFav = favorites.some((fav) => fav.id === data.id);
        setIsFavorite(isFav);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pokemon.url, pokemon, favorites]);

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

  function handleCardClick() {
    onFlip(pokemon.name);
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

  const renderTalentTree = () => {
    if (!pokemonData) return null;

    const types = pokemonData.types.map((t) => t.type.name);
    const pokemonInnate = innateAbilities[pokemonData.name.toLowerCase()] || [];

    return (
      <div className="talent-tree-content">
        <h2 className="talent-tree-title">{pokemonData.name}</h2>

        {types.map((typeName) => {
          const tree = typeTalentTrees[typeName];
          if (!tree) return null;

          return (
            <div key={typeName} className="talent-type-section">
              <h3 className={`talent-type-header ${typeName}`}>
                <img
                  src={getTypeIcon(typeName)}
                  alt={typeName}
                  className="talent-type-icon"
                />
                {tree.type}
              </h3>
              <ul className="talent-list">
                {tree.talents.map((talent) => (
                  <li key={talent.name} className="talent-item">
                    <span className="talent-name">{talent.name}</span>
                    <span className="talent-desc">{talent.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <div className="talent-type-section innate-section">
          <h3 className="talent-type-header innate">
            &#11088; Habilidades Inatas
          </h3>
          <ul className="talent-list">
            {pokemonInnate.length > 0
              ? pokemonInnate.map((talent) => (
                  <li key={talent.name} className="talent-item">
                    <span className="talent-name">{talent.name}</span>
                    <span className="talent-desc">{talent.description}</span>
                  </li>
                ))
              : pokemonData.abilities?.map(({ ability }) => (
                  <li key={ability.name} className="talent-item">
                    <span className="talent-name">{ability.name}</span>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <>
      {pokemonData && (
        <li className="pokeListContainer">
          <div className={`card-flip-container ${isFlipped ? "flipped" : ""}`}>
            <div className="card-flip-inner">
              {/* FRONT */}
              <div className="card-front">
                <button
                  className="poke"
                  id={pokemonData.types[0].type.name}
                >
                  <div>
                    <img
                      onClick={handleCardClick}
                      className={pokemonData.types[0].type.name}
                      src={pokemonData.sprites?.front_default}
                      alt={pokemonData.name}
                    />
                  </div>
                  <div className="containerPokeButton">
                    <p className="topPokeButton">
                      <div className="numberPokemon">
                        N\u00ba {pokemonData.id}
                      </div>

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
              </div>

              {/* BACK */}
              <div
                className="card-back"
                id={pokemonData.types[0].type.name}
              >
                <div
                  className="card-back-return"
                  onClick={handleCardClick}
                  title="Voltar"
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                </div>
                {renderTalentTree()}
              </div>
            </div>
          </div>
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
              </div>
            </div>
          </Modal>
        </li>
      )}
    </>
  );
};

export default Pokemon;
