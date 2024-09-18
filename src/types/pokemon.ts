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
    back_default: string;
    front_shiny: string;
    back_shiny: string;
    front_female: string | null;
    back_female: string | null;
    front_shiny_female: string | null;
    back_shiny_female: string | null;
    other: {
      dream_world: {
        front_default: string;
        front_female: string | null;
      };
      home: {
        front_default: string;
        front_female: string | null;
        front_shiny: string;
        front_shiny_female: string | null;
      };
      "official-artwork": {
        front_default: string;
        front_shiny: string;
      };
      showdown?: {
        front_default: string;
        back_default: string;
        back_shiny: string;
        front_shiny: string;
      };
    };
    versions: {
      "generation-i": {
        "red-blue": {
          front_default: string;
          back_default: string;
        };
        yellow: {
          front_default: string;
          back_default: string;
        };
      };
      "generation-ii": {
        crystal: {
          front_default: string;
          back_default: string;
          front_shiny: string;
          back_shiny: string;
        };
        gold: {
          front_default: string;
          back_default: string;
          front_shiny: string;
          back_shiny: string;
        };
        silver: {
          front_default: string;
          back_default: string;
          front_shiny: string;
          back_shiny: string;
        };
      };
      "generation-iii": {
        emerald: {
          front_default: string;
          back_default: string;
        };
        "firered-leafgreen": {
          front_default: string;
          back_default: string;
        };
        "ruby-sapphire": {
          front_default: string;
          back_default: string;
        };
      };
      "generation-iv": {
        "diamond-pearl": {
          front_default: string;
          back_default: string;
        };
        "heartgold-soulsilver": {
          front_default: string;
          back_default: string;
        };
        platinum: {
          front_default: string;
          back_default: string;
        };
      };
      "generation-v": {
        "black-white": {
          front_default: string;
          back_default: string;
        };
      };
      "generation-vi": {
        "omegaruby-alphasapphire": {
          front_default: string;
          back_default: string;
        };
        "x-y": {
          front_default: string;
          back_default: string;
        };
      };
      "generation-vii": {
        icons: {
          front_default: string;
          front_female: string | null;
        };
        "ultra-sun-ultra-moon": {
          front_default: string;
          back_default: string;
        };
      };
      "generation-viii": {
        icons: {
          front_default: string;
          front_female: string | null;
        };
      };
    };
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

interface IPokemonMove {
  attackName: string;
  moveType: string;
  power: number;
}

interface IPokemonDetails {
  pokemonNumber: number;
  pokemonSprite: string;
  pokemonName: string;
  pokemonMoves: IPokemonMove[];
}
