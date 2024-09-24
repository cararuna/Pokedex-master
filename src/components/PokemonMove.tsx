import React from "react";
import "../../src/PokemonMove.css";

interface IMove {
  attackName: string;
  moveType: string;
  power: number;
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
  return (
    <div className="PokemonMove">
      <img className="PokemonImg" src={props.sprites} alt={props.name} />
      <h2 style={{ margin: "auto" }}>
        {props.name} (#{props.number})
      </h2>
      <ul>
        {props.moves.map((move: any, index: any) => (
          <li key={index} className="pokeInfoLine">
            <img
              src={getImageForType(move.moveType)}
              alt={move.moveType}
              className="MoveTypeImg"
            />
            {move.attackName} - {move.moveType} - Power: {move.power}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PokemonMove;
