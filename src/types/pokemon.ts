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

  moves: {
    move: {
      name: string;
      url: string;
    };
    version_group_details: {
      level_learned_at: number;
      version_group: {
        name: string;
        url: string;
      };
      move_learn_method: {
        name: string;
        url: string;
      };
    }[];
  }[];

  moveTypes?: string[]; // Adicionando a propriedade moveTypes como opcional
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
