import React from "react";
import "../../src/PokemonMove.css";

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
    water: ["fire", "rock", "ground"],
    electric: ["water", "flying"],
  };

  const advantages = advantagesMap[moveType] || [];

  const columnCount =
    advantages.length <= 2 ? 1 : Math.ceil(advantages.length / 2);

  return (
    <div
      className={`pokeAdvantagesInfoLine pokeInfoLine ${moveType}-bg`}
      style={{
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
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
  );
};

const PokemonMove: React.FC<any> = (props) => {
  const pokemonTypeClass = props.pokemonType;
  // const pokemonTypeClass = props.pokemonType;
  console.log(props);

  return (
    <div className={`PokemonMove ${pokemonTypeClass}`}>
      <h2 style={{ margin: "auto" }}>
        {props.name} (#{props.number})
      </h2>
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
              <div className={`pokeInfoLine ${move.moveType}-bg`}>
                {move.attackName}
              </div>
            </div>
            <div
              style={{ width: "1rem" }}
              className={`pokeInfoLine powerInfo ${move.moveType}-bg`}
            >
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
