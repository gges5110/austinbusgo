import { useAtom } from "jotai";
import { recentSearchesAtom } from "../Atoms";
import { isRoute, isStop } from "../components/Route/SearchPanel";
import { Route, Stop } from "../interfaces/interface.d";

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useAtom(recentSearchesAtom);

  const addToRecentSearches = (search: Stop | Route): void => {
    const newValueInRecentSearchStops = recentSearches.some((recentSearch) => {
      if (isRoute(search)) {
        return isRoute(recentSearch) && search.routeId === recentSearch.routeId;
      } else if (isStop(search)) {
        return isStop(recentSearch) && search.stopId === recentSearch.stopId;
      }

      return false;
    });
    if (!newValueInRecentSearchStops) {
      setRecentSearches((prev) => {
        return [...prev, search];
      });
    }
  };

  return {
    recentSearches,
    addToRecentSearches,
  };
};
