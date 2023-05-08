import { useAtom } from "jotai";
import { recentSearchesAtom } from "../Atoms";
import {
  isRoute,
  isSearchTerm,
  isStop,
  OptionValue,
} from "../components/SearchPanel/SearchPanel";

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useAtom(recentSearchesAtom);

  const addToRecentSearches = (search: OptionValue): void => {
    const newValueInRecentSearchStops = recentSearches.some((recentSearch) => {
      if (isRoute(search)) {
        return isRoute(recentSearch) && search.routeId === recentSearch.routeId;
      } else if (isStop(search)) {
        return isStop(recentSearch) && search.stopId === recentSearch.stopId;
      } else if (isSearchTerm(search)) {
        return (
          isSearchTerm(recentSearch) && search.value === recentSearch.value
        );
      }

      return false;
    });
    if (!newValueInRecentSearchStops) {
      setRecentSearches((prev) => {
        return [search, ...prev];
      });
    }
  };

  return {
    recentSearches,
    addToRecentSearches,
  };
};
