import {
  isRoute,
  isSearchTerm,
  isStop,
  OptionValue,
} from "features/search/components/SearchPanel/hooks/searchPanelUtils";
import { useAtom } from "jotai";
import { recentSearchesAtom } from "shared/state/atoms";

export interface RecentSearch {
  timestamp: number;
  value: OptionValue;
}

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useAtom(recentSearchesAtom);

  const addToRecentSearches = (search: OptionValue): void => {
    if (isSearchTerm(search) && search.value === "") {
      return;
    }

    setRecentSearches((recentSearches) => {
      const index = recentSearches.findIndex((recentSearch) => {
        const { value } = recentSearch;

        if (isRoute(search)) {
          return isRoute(value) && search.routeId === value.routeId;
        } else if (isStop(search)) {
          return isStop(value) && search.stopId === value.stopId;
        } else if (isSearchTerm(search)) {
          return isSearchTerm(value) && search.value === value.value;
        }

        return false;
      });

      if (index === -1) {
        return [{ timestamp: Date.now(), value: search }, ...recentSearches];
      } else {
        const arrExcludingTarget = [
          ...recentSearches.slice(0, index),
          ...recentSearches.slice(index + 1),
        ];

        return [
          { timestamp: Date.now(), value: search },
          ...arrExcludingTarget,
        ];
      }
    });
  };

  return {
    recentSearches: recentSearches,
    addToRecentSearches,
  };
};
