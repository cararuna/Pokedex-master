import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import { useContext, useEffect, useState } from "react";
import Modal from "react-modal";
import { IPokemon, IPokemonData } from "../types/pokemon";
import { Context } from "./GlobalContext";

interface IPokemonProps {
  pokemon: IPokemon;
}

const Pokemon = ({ pokemon }: IPokemonProps) => {
  /* const [isFavorite, setIsFavorite] = useState(false) */

  const { favorites, setFavorites } = useContext(Context);

  const [pokemonData, setPokemonData] = useState<IPokemonData>();

  useEffect(() => {
    if (pokemon.url) {
      const loadImgPokemon = () => {
        fetch(pokemon.url)
          .then((res) => res.json())
          .then((data: IPokemonData) => {
            setPokemonData(data);
          });
      };
      loadImgPokemon();
    } else {
      setPokemonData(pokemon as IPokemonData);
    }
  }, [pokemon.url]);

  const [modalIsOpen, setIsOpen] = useState(false);

  function handleOpenModal() {
    setIsOpen(true);
  }

  function handleCloseModal() {
    setIsOpen(false);
  }

  function handleFavoriteClick() {
    if (pokemonData) {
      const favIndex = favorites.findIndex(
        (favorite) => favorite.name === pokemonData.name
      );
      if (favIndex === -1) {
        setFavorites([...favorites, pokemonData]);
      } else {
        setFavorites(
          [...favorites].filter((favorite, index) => index !== favIndex)
        );
      }
    }
  }

  const isFavorite = () => {
    return favorites.some((favorite) => favorite.name === pokemonData?.name);
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

                <div
                  id="buttonFavorite"
                  onClick={handleFavoriteClick}
                  /* onClick={() => {handleFavoriteClick()}} */
                >
                  <FontAwesomeIcon
                    icon={faStar}
                    color={isFavorite() ? "gold" : "white"}
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
                      <ul
                        className="progress-value"
                        /* style={{ width: { base_stat } }} */
                      ></ul>
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
