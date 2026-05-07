import React from "react";
import "../../src/PokemonMove.css";
import useAddMoves from "../hooks/useAddMoves";
import { typeTalentTrees, innateAbilities, getTypeIcon } from "../data/talentTrees";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateLeft } from "@fortawesome/free-solid-svg-icons";

interface IMove {
  attackName: string;
  moveType: string;
  power: number;
  pokemonType: string;
}

const getImageForType = (moveType: string) => {
  switch (moveType.toLowerCase()) {
    case "normal":
      return "/normalType.png";
    case "grass":
      return "/grassType.png";
    case "fire":
      return "/fireType.png";
    case "dragon":
      return "/dragonType.png";
    case "steel":
      return "/steelType.png";
    case "dark":
      return "/darkType.png";
    case "ghost":
      return "/ghostType.png";
    case "flying":
      return "/flyingType.png";
    case "water":
      return "/waterType.png";
    case "bug":
      return "/bugType.png";
    case "psychic":
      return "/psychicType.png";
    case "poison":
      return "/poisonType.png";
    case "electric":
      return "/electricType.png";
    case "ground":
      return "/groundType.png";
    case "fighting":
      return "/fightingType.png";
    case "fairy":
      return "/fairyType.png";
    case "ice":
      return "/iceType.png";
    case "rock":
      return "/rockType.png";
    default:
      return "/normalType.png";
  }
};

const checkListVantages = (moveType: string) => {
  const advantagesMap: { [key: string]: string[] } = {
    grass: ["water", "rock", "ground"],
    fire: ["grass", "bug", "ice", "steel"],
    dragon: ["dragon"],
    steel: ["fairy", "rock", "ice"],
    dark: ["ghost", "psychic"],
    ghost: ["ghost", "psychic"],
    flying: ["fighting", "bug", "grass"],
    water: ["fire", "rock", "ground"],
    bug: ["dark", "psychic", "grass"],
    psychic: ["fighting", "poison"],
    poison: ["fairy", "grass"],
    electric: ["water", "flying"],
    ground: ["electric", "poison", "steel", "fire", "rock"],
    fighting: ["dark", "normal", "steel", "ice", "rock"],
    fairy: ["dark", "fighting", "dragon"],
    ice: ["dragon", "grass", "flying", "ground"],
    rock: ["fire", "ice", "flying", "bug"],
  };

  const advantages = advantagesMap[moveType] || [];

  const columnCount =
    advantages.length <= 2 ? 1 : Math.ceil(advantages.length / 2);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
      }}
      className={`pokeAdvantagesInfoLine pokeInfoLine ${moveType}-bg`}
    >
      <div>+</div>
      <div
        className={`pokeAdvantagesInfoLine pokeInfoLine ${moveType}-bg`}
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gap: "0.1rem",
          width: "32px",
          padding: "0",
        }}
      >
        {advantages.map((advantageType) => (
          <img
            key={advantageType}
            src={getImageForType(advantageType)}
            alt={advantageType}
            className="MoveTypeImgAdvantage"
          />
        ))}
      </div>
    </div>
  );
};

const PokemonMove: React.FC<any> = (props) => {
  useAddMoves(props.name, props.moves);

  const pokemonTypeClass = props.pokemonType;
  const pokemonTypes: string[] = props.pokemonTypes;
  const abilities: string[] = props.abilities || [];
  const isFlipped: boolean = props.isFlipped || false;
  const onFlip: (name: string) => void = props.onFlip;

  const handleCardClick = () => {
    if (onFlip) onFlip(props.name);
  };

  const renderTalentTree = () => {
    const pokemonInnate = innateAbilities[props.name.toLowerCase()] || [];

    return (
      <div className="talent-tree-content">
        <h2 className="talent-tree-title">
          {props.name.charAt(0).toUpperCase() + props.name.slice(1)}
        </h2>

        {pokemonTypes.map((typeName: string) => {
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
            {pokemonInnate.map((talent) => (
              <li key={talent.name} className="talent-item">
                <span className="talent-name">{talent.name}</span>
                <span className="talent-desc">{talent.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="pokemove-flip-container">
      <div className={`pokemove-flip-inner ${isFlipped ? "flipped" : ""}`}>
        {/* FRONT */}
        <div className="pokemove-flip-front">
          <div className={`PokemonMove ${pokemonTypeClass}`}>
            <div>
              <h3
                className={`pokeTitle pokeInfoMove pokeInfoLine ${pokemonTypeClass}-bg`}
                style={{ margin: "auto" }}
              >
                <div className="pokeTypesInfo">
                  {pokemonTypes.map((type: any, index: any) => (
                    <li
                      style={{ padding: "0" }}
                      key={index}
                      className={`pokeInfoLine `}
                    >
                      <img
                        src={getImageForType(type)}
                        alt={type}
                        className="MoveTypeImg"
                      />
                    </li>
                  ))}
                </div>
                {props.name.charAt(0).toUpperCase() + props.name.slice(1)} (#
                {props.number})
              </h3>
            </div>
            <img
              className={`PokemonImg ${pokemonTypeClass}`}
              src={props.sprites}
              alt={props.name}
              onClick={handleCardClick}
            />
            <div>
              {props.moves.map((move: any, index: any) => (
                <li key={index} className={`pokeInfoLine `}>
                  <div
                    style={{ width: "1rem" }}
                    className={`pokeInfoMove pokeInfoLine ${move.moveType}-bg`}
                  >
                    <img
                      src={getImageForType(move.moveType)}
                      alt={move.moveType}
                      className="MoveTypeImg"
                    />
                    <div
                      className={`pokeInfoLine textEllipsis ${move.moveType}-bg`}
                    >
                      {move.attackName}
                    </div>
                  </div>
                  <div className={`pokeInfoLine powerInfo ${move.moveType}-bg`}>
                    {move.power}
                  </div>
                  {checkListVantages(move.moveType)}
                </li>
              ))}
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className={`pokemove-flip-back ${pokemonTypeClass}`}>
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
  );
};

export default PokemonMove;
