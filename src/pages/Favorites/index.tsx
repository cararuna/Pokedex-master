import ListaPokemon from "../../components/ListaPokemon";
import "../Home/index.css";
import { useFavorites } from "./hooks/useFavorites";

interface IData {
  id: number;
  userId: number;
  pokemonId: number;
}
export const Favorites = () => {
  const { favorites } = useFavorites();

  return (
    <div className="container">
      <ListaPokemon list={favorites} isFavoritePage={true} />
    </div>
  );
};
