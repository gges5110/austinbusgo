import { useEffect, useState } from "react";
import { SearchQuery } from "shared/api/schemas/Search.generated";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import { Route } from "shared/types/interface.d";

import { SearchOption, SearchType } from "./searchPanelUtils";

interface UseSearchOptionsParams {
  inputString: string;
  stops: SearchQuery["search"]["stops"];
  routes: Route[];
  value: SearchOption | null;
}

export const useSearchOptions = ({
  inputString,
  stops,
  routes,
  value,
}: UseSearchOptionsParams) => {
  const [options, setOptions] = useState<SearchOption[]>([]);
  const {
    recentSearches,
    addToRecentSearches,
    removeFromRecentSearches,
  } = useRecentSearches();

  useEffect(() => {
    let options: SearchOption[];
    if (inputString === "") {
      options = recentSearches.map((search) => ({
        type: SearchType.recent,
        optionValue: search.value,
      }));
    } else {
      options = [
        ...stops.map((stop) => ({
          type: SearchType.search,
          optionValue: stop,
        })),
        ...routes.map((route) => ({
          type: SearchType.search,
          optionValue: route,
        })),
      ];

      if (value && options.length === 0) {
        options.push(value);
      }
    }

    setOptions(options);
  }, [inputString, stops, routes, value, recentSearches]);

  return {
    options,
    addToRecentSearches,
    removeFromRecentSearches,
  };
};
