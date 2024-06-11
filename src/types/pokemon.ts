export interface IPokemonData {
  id: number;
  name: string;
  url: string;
  height: number;
  weight: number;
  types: {
    type: {
      name: string;
      url: string;
    };
  }[];
  isFavorite?: boolean;

  abilities: {
    ability: {
      name: string;
      url: string;
    };
  }[];

  stats: {
    base_stat: number;
    stat: {
      name: string;
    };
  }[];

  sprites?: {
    front_default: string;
  };
}

export interface IPokemon {
  name: string;
  url: string;
  id: number;
  types: {
    type: {
      name: string;
      url: string;
    };
  }[];
}

export enum PokemonType {
  normal = "normal",
  fire = "fire",
  water = "water",
  grass = "grass",
  flying = "flying",
  fighting = "fighting",
  poison = "poison",
  electric = "electric",
  ground = "ground",
  rock = "rock",
  psychic = "psychic",
  ice = "ice",
  bug = "bug",
  ghost = "ghost",
  steel = "steel",
  dragon = "dragon",
  dark = "dark",
  fairy = "fairy",
}
