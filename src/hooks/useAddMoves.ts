import { useEffect } from "react";

const useAddMoves = (name: string, moves: any[]) => {
  useEffect(() => {
    const addMoves = () => {
      if (name === "venusaur") {
        const newMoves = [
          { attackName: "bulldoze", moveType: "ground", power: 8 },
          { attackName: "toxic", moveType: "poison", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "alakazam") {
        const newMoves = [
          { attackName: "fire-punch", moveType: "fire", power: 8 },
          { attackName: "thunder-punch", moveType: "electric", power: 8 },
          { attackName: "ice-punch", moveType: "ice", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "raticate") {
        const newMoves = [
          { attackName: "dig", moveType: "ground", power: 8 },
          { attackName: "flame-wheel", moveType: "fire", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "raichu") {
        const newMoves = [
          { attackName: "sweet-kiss", moveType: "fairy", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "wigglytuff") {
        const newMoves = [
          { attackName: "heal-pulse", moveType: "psychic", power: 8 },
          { attackName: "rollout", moveType: "rock", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "wigglytuff") {
        const newMoves = [
          { attackName: "heal-pulse", moveType: "psychic", power: 8 },
          { attackName: "rollout", moveType: "rock", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "golduck") {
        const newMoves = [
          { attackName: "cross-chop", moveType: "fighting", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "slowbro") {
        const newMoves = [
          { attackName: "belch", moveType: "poison", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "magneton") {
        const newMoves = [
          { attackName: "light-screen", moveType: "psychic", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "electrode") {
        const newMoves = [
          { attackName: "metal-sound", moveType: "steel", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "exeggutor") {
        const newMoves = [
          { attackName: "sunnyday", moveType: "fire", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "marowak") {
        const newMoves = [
          { attackName: "iron-head", moveType: "steel", power: 8 },
          { attackName: "ancient-power", moveType: "rock", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "electabuzz") {
        const newMoves = [
          { attackName: "low-kick", moveType: "fighting", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "meganium") {
        const newMoves = [
          { attackName: "reflect", moveType: "psychic", power: 10 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "typhlosion") {
        const newMoves = [
          { attackName: "infernal-parade", moveType: "ghost", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "furret") {
        const newMoves = [
          { attackName: "agility", moveType: "psychic", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "wobbuffet") {
        const newMoves = [
          { attackName: "splash", moveType: "normal", power: 8 },
          { attackName: "amnesia", moveType: "psychic", power: 8 },
          { attackName: "counter", moveType: "fighting", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "kingdra") {
        const newMoves = [
          { attackName: "agility", moveType: "psychic", power: 8 },
          { attackName: "icy-wind", moveType: "ice", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "swellow") {
        const newMoves = [
          { attackName: "agility", moveType: "psychic", power: 8 },
          { attackName: "quick-guard", moveType: "fighting", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "roselia") {
        const newMoves = [
          { attackName: "extra-sensory", moveType: "psychic", power: 8 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "swalot") {
        const newMoves = [{ attackName: "curse", moveType: "ghost", power: 8 }];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "swalot") {
        const newMoves = [{ attackName: "curse", moveType: "ghost", power: 8 }];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "absol") {
        const newMoves = [
          { attackName: "mega-horn", moveType: "bug", power: 10 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }

      if (name === "absol") {
        const newMoves = [
          { attackName: "mega-horn", moveType: "bug", power: 10 },
        ];
        newMoves.forEach((newMove) => {
          const exists = moves.some(
            (move) => move.attackName === newMove.attackName
          );
          if (!exists) {
            moves.push(newMove);
          }
        });
      }
    };

    addMoves();
  }, [name, moves]);
};

export default useAddMoves;
