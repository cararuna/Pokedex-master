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

const PokemonMove: React.FC<any> = (props) => {
  const pokemonTypeClass = props.pokemonType;
  // const pokemonTypeClass = props.pokemonType;
  const pokemonMoveTypeClass = props.pokemonType;

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
          <li key={index} className={`pokeInfoLine ${move.moveType}-bg`}>
            <div className={`pokeInfoMove`}>
              <img
                src={getImageForType(move.moveType)}
                alt={move.moveType}
                className="MoveTypeImg"
              />
              <div className="class">{move.attackName}</div>
            </div>
            <div className="class">{move.power}</div>
            <div className="class">vantagens</div>
          </li>
        ))}
      </div>
    </div>
  );
};

export default PokemonMove;
