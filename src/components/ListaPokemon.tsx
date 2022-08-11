import { IPokemon } from '../types/pokemon'
import '../ListaPokemon.css'
import Pokemon from './Pokemon'
import { Link } from 'react-router-dom'

interface Props {
  loadNextPage?: () => void
  loadPreviousPage?: () => void
  list: IPokemon[]
  isFavoritePage?: boolean
}

export default function ListaPokemon({
  loadNextPage,
  loadPreviousPage,
  list,
  isFavoritePage
}: Props) {
  console.log(list)

  return (
    <div className="principalPage">
      {isFavoritePage ? (
        <Link to="/" className="buttons">
          <button className="footerButton">Back</button>
        </Link>
      ) : (
        <div className="buttons">
          <button onClick={loadPreviousPage} className="footerButton">
            Previous
          </button>
          <button onClick={loadNextPage} className="footerButton">
            Next
          </button>
        </div>
      )}

      <div className="containerList">
        <div className="pokeMap">
          {list.map(pokemon => (
            <Pokemon key={pokemon.name} pokemon={pokemon} />
          ))}
        </div>
      </div>
    </div>
  )
}
