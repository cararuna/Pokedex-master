import '../components/Search.css'
import { PokemonType } from '../types/pokemon'

interface Props {
  setInputText: (text: string) => void
  setSelectValue: (text: string) => void
}

export default function Search({ setInputText, setSelectValue }: Props) {
  return (
    <>
      <div className='logoContainer'>
        <img className="logo" src="pokemon-logo.png" alt="Pokemon logo" />
      </div>
      <div className="containerSearch">
        <input
          type="text"
          id="header-search"
          placeholder="Search by name"
          name="s"
          onChange={e => setInputText(e.target.value.toLowerCase())}
        />
        <select onChange={e => setSelectValue(e.target.value)}>
          <option value="">select a type</option>
          {Object.values(PokemonType).map(pokemonType => (
            <option key={pokemonType} value={pokemonType}>
              {pokemonType}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}
