import React, { useState } from 'react'
import ListaPokemon from './components/ListaPokemon'
import { Context } from './components/GlobalContext'
import Search from './components/Search'
import { IPokemon } from './types/pokemon'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { Home } from './pages/Home'
import { Favorites } from './pages/Favorites'

export default function App() {
  const [favorites, setFavorites] = useState<IPokemon[]>([])

  return (
    <BrowserRouter>
      <Context.Provider value={{ favorites, setFavorites }}>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/favorites" exact component={Favorites} />
        </Switch>
      </Context.Provider>
    </BrowserRouter>
  )
}
