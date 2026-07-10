import { useEffect } from "react";
import { Route, Stop } from "shared/types/interface.d";

import { SearchOption, toSearchOption } from "./searchPanelUtils";

interface UseSearchSyncParams {
  route?: Route;
  stop?: Stop;
  searchTerm?: string;
  setInputString: (value: string) => void;
  setValue: (value: SearchOption | null) => void;
  onOpenChange: (open: boolean) => void;
  search: (value: string) => void;
  isOnFavoritesPage?: boolean;
  isOnRecentSearchesPage?: boolean;
}

/**
 * Hook to synchronize internal search state with URL parameters.
 * When route, stop, or searchTerm changes from the URL, this hook updates
 * the input string, selected value, and panel open state accordingly.
 */
export const useSearchSync = ({
  route,
  stop,
  searchTerm,
  setInputString,
  setValue,
  onOpenChange,
  search,
  isOnFavoritesPage,
  isOnRecentSearchesPage,
}: UseSearchSyncParams) => {
  useEffect(() => {
    if (isOnFavoritesPage) {
      setInputString("Favorites");
      setValue(null);
      onOpenChange(false);
    } else if (isOnRecentSearchesPage) {
      setInputString("Recent Searches");
      setValue(null);
      onOpenChange(false);
    } else if (searchTerm) {
      setInputString(searchTerm);
      setValue(toSearchOption({ value: searchTerm }, true));
      onOpenChange(false);
    } else if (stop) {
      const option = toSearchOption(stop, true);
      setInputString(option.label);
      setValue(option);
      search(option.label);
      onOpenChange(false);
    } else if (route) {
      const option = toSearchOption(route, true);
      setInputString(option.label);
      setValue(option);
      search(option.label);
      onOpenChange(false);
    } else {
      setInputString("");
    }
    // setInputString and search are memoized in useSearchInput, so they're stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, stop, route, isOnFavoritesPage, isOnRecentSearchesPage]);
};
