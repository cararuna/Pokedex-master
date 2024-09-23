import React from "react";
import "../../src/PokemonMove.css";
import { IPokemonData } from "../types/pokemon";

interface IMove {
  attackName: string;
  moveType: string;
  power: number;
}

/* interface PokemonMoveProps {
  number: number;
  name: string;
  moves: IMove[];
} */

const PokemonMove: React.FC<any> = (props) => {
  return (
    <div className="PokemonMove">
      <img className="PokemonImg" src={props.sprites} alt={props.name} />
      <h2>
        {props.name} (#{props.number})
      </h2>
      <ul>
        {props.moves.map((move: any, index: any) => (
          <li key={index}>
            {move.name} - {move.moveType} - Power: {move.power}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PokemonMove;
