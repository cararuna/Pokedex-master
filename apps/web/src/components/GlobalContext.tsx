import { createContext } from 'react'
import { IPokemon } from '../types/pokemon'

interface IState {
  favorites: IPokemon[]
  setFavorites(x: IPokemon[]): void
}

export const Context = createContext({} as IState)
