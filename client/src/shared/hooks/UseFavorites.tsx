import {
  isRoute,
  isStop,
} from "features/search/components/SearchPanel/hooks/searchPanelUtils";
import { useAtom } from "jotai";
import { favoritesAtom, FavoritesType } from "shared/state/atoms";

export const useFavorites = () => {
  const [favorites, setFavorites] = useAtom(favoritesAtom);

  const containsFavorite = (value: FavoritesType): boolean => {
    const index = favorites.findIndex((favorite) => {
      if (isRoute(favorite)) {
        return isRoute(value) && favorite.routeId === value.routeId;
      } else if (isStop(favorite)) {
        return isStop(value) && favorite.stopId === value.stopId;
      }

      return false;
    });

    return index !== -1;
  };
  const addToFavorites = (value: FavoritesType) => {
    setFavorites((previousFavorites) => {
      const index = previousFavorites.findIndex((previousFavorite) => {
        if (isRoute(previousFavorite)) {
          return isRoute(value) && previousFavorite.routeId === value.routeId;
        } else if (isStop(previousFavorite)) {
          return isStop(value) && previousFavorite.stopId === value.stopId;
        }

        return false;
      });

      if (index === -1) {
        return [value, ...previousFavorites];
      }
      return previousFavorites;
    });
  };

  const removeFromFavorites = (value: FavoritesType) => {
    setFavorites((previousFavorites) => {
      const index = previousFavorites.findIndex((previousFavorite) => {
        if (isRoute(previousFavorite)) {
          return isRoute(value) && previousFavorite.routeId === value.routeId;
        } else if (isStop(previousFavorite)) {
          return isStop(value) && previousFavorite.stopId === value.stopId;
        }

        return false;
      });

      if (index !== -1) {
        return [
          ...previousFavorites.slice(0, index),
          ...previousFavorites.slice(index + 1),
        ];
      }
      return previousFavorites;
    });
  };

  return { addToFavorites, favorites, containsFavorite, removeFromFavorites };
};
