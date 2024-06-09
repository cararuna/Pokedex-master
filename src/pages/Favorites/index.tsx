import { useContext, useEffect } from "react";
import { Context } from "../../components/GlobalContext";
import ListaPokemon from "../../components/ListaPokemon";
import "../Home/index.css";

export const Favorites = () => {
  const { favorites } = useContext(Context);

  return (
    <div className="container">
      <ListaPokemon list={favorites} isFavoritePage={true} />
    </div>
  );
};
