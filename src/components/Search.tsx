import "../components/Search.css";
import { PokemonType } from "../types/pokemon";

interface Props {
  setInputText: (text: string) => void;
  setSelectValue?: (text: string) => void;
  hasSelect: boolean;
  placeholder?: string;
}

export default function Search({
  setInputText,
  setSelectValue,
  hasSelect,
  placeholder,
}: Props) {
  return (
    <>
      <div className="logoContainer">
        <img className="logo" src="pokemon-logo.png" alt="Pokemon logo" />
      </div>
      <div className="containerSearch">
        <input
          type="text"
          id="header-search"
          placeholder={placeholder || "Search by Name"}
          name="s"
          onChange={(e) => setInputText(e.target.value.toLowerCase())}
        />
        {hasSelect && setSelectValue && (
          <select onChange={(e) => setSelectValue(e.target.value)}>
            <option value="">select a type</option>
            {Object.values(PokemonType).map((pokemonType) => (
              <option key={pokemonType} value={pokemonType}>
                {pokemonType}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  );
}
