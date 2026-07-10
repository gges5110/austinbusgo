import { useMemo } from "react";
import { SearchQuery } from "shared/api/schemas/Search.generated";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import { Route } from "shared/types/interface.d";

import { SearchOption, toSearchOption } from "./searchPanelUtils";

const MAX_RECENT_OPTIONS = 8;

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
  const { recentSearches, removeFromRecentSearches } = useRecentSearches();

  const options = useMemo<SearchOption[]>(() => {
    if (inputString === "") {
      // Show recent searches; when they overflow, show one fewer and append
      // a "View all" option instead
      const overflows = recentSearches.length > MAX_RECENT_OPTIONS;
      const recentOptions = (
        overflows
          ? recentSearches.slice(0, MAX_RECENT_OPTIONS - 1)
          : recentSearches
      ).map((search) => toSearchOption(search.value, true));
      return overflows
        ? [...recentOptions, toSearchOption({ type: "viewAll" })]
        : recentOptions;
    }

    const results = [
      ...routes.map((route) => toSearchOption(route)),
      ...stops.map((stop) => toSearchOption(stop)),
    ];
    // Keep the current selection listed while results are empty so the
    // Autocomplete value always matches an option
    return results.length === 0 && value ? [value] : results;
  }, [inputString, stops, routes, value, recentSearches]);

  return {
    options,
    removeFromRecentSearches,
  };
};
