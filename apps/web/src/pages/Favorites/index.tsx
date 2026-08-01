import ListaPokemon from "../../components/ListaPokemon";
import "../Home/index.css";
import { useFavorites } from "./hooks/useFavorites";

export const Favorites = () => {
  const { favorites } = useFavorites();

  return (
    <div className="container">
      <ListaPokemon list={favorites} isFavoritePage={true} />
    </div>
  );
};
