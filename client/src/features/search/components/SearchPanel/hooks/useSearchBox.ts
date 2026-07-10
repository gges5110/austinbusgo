import { useState } from "react";
import { useLocation, useNavigation, useParams } from "react-router-dom";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";

import { SearchOption } from "./searchPanelUtils";
import { useSearchInput } from "./useSearchInput";
import { useSearchNavigation } from "./useSearchNavigation";
import { useSearchOptions } from "./useSearchOptions";
import { useSearchSync } from "./useSearchSync";

/**
 * Owns all search box state (typed input, selected option, options list)
 * and its synchronization with the URL, so SearchAutocomplete is left with
 * just presentation.
 */
export const useSearchBox = (onOpenChange: (open: boolean) => void) => {
  const [value, setValue] = useState<SearchOption | null>(null);
  const { currentRoute } = useCurrentRoute();
  const { currentStop } = useCurrentStop();
  const { searchTerm } = useParams();
  const location = useLocation();

  const navigation = useNavigation();
  const externalLoading = navigation.location !== undefined;

  const isOnFavoritesPage = location.pathname.startsWith("/favorites");
  const isOnRecentSearchesPage =
    location.pathname.startsWith("/recent-searches");

  const {
    inputString,
    setInputString,
    stops,
    routes,
    isLoading,
    handleInputValueChange,
    search,
  } = useSearchInput();

  const { options, removeFromRecentSearches } = useSearchOptions({
    inputString,
    stops,
    routes,
    value,
  });

  const { handleSelect, handleClear, handleSearch } = useSearchNavigation();

  // Sync input with URL parameters
  useSearchSync({
    route: currentRoute,
    stop: currentStop,
    searchTerm,
    setInputString,
    setValue,
    onOpenChange,
    search,
    isOnFavoritesPage,
    isOnRecentSearchesPage,
  });

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: SearchOption | null
  ) => {
    setValue(newValue);
    if (newValue) {
      handleSelect(newValue);
    }
  };

  const handleClearSelection = () => {
    handleClear();
    // Favorites/recent pages keep their heading as the input text; otherwise
    // reset to an empty, open search box
    if (!isOnFavoritesPage && !isOnRecentSearchesPage) {
      setInputString("");
      setValue(null);
      onOpenChange(true);
    }
  };

  const handleEnterPress = () => {
    handleSearch(inputString.trim());
  };

  return {
    value,
    inputString,
    options,
    loading: isLoading || externalLoading,
    handleInputValueChange,
    handleChange,
    handleClearSelection,
    handleEnterPress,
    removeFromRecentSearches,
  };
};
