import React from "react";
import "../../src/PokemonMove.css";
import useAddMoves from "../hooks/useAddMoves"; // Adjust the path as necessary

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
      return "/normalType.png"; // Default case, caso o tipo não seja reconhecido
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
  const pokemonTypes = props.pokemonTypes;

  return (
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
              <div className={`pokeInfoLine textEllipsis ${move.moveType}-bg`}>
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
  );
};

export default PokemonMove;
