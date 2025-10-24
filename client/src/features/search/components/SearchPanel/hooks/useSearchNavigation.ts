import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";

import {
  isRoute,
  isSearchTerm,
  isStop,
  SearchOption,
} from "./searchPanelUtils";

export const useSearchNavigation = () => {
  const navigate = useNavigate();
  const { currentRoute, setRoute } = useCurrentRoute();
  const { setStop } = useCurrentStop();
  const { viewStatePathname } = useViewStatePathname();
  const { addToRecentSearches } = useRecentSearches();

  const handleSearch = useCallback(
    (searchTerm: string) => {
      navigate(`${viewStatePathname}/search/${encodeURIComponent(searchTerm)}`);
    },
    [navigate, viewStatePathname]
  );

  const handleSelect = useCallback(
    (option: SearchOption) => {
      const { optionValue } = option;
      if (isRoute(optionValue)) {
        if (currentRoute?.routeId !== optionValue.routeId) {
          setRoute(optionValue);
          addToRecentSearches(optionValue);
        }
      } else if (isStop(optionValue)) {
        setStop(optionValue);
        addToRecentSearches(optionValue);
      } else if (isSearchTerm(optionValue)) {
        handleSearch(optionValue.value);
      }
    },
    [currentRoute, setRoute, setStop, addToRecentSearches, handleSearch]
  );

  const handleClear = useCallback(() => {
    navigate(viewStatePathname);
  }, [navigate, viewStatePathname]);

  return {
    handleSelect,
    handleClear,
    handleSearch,
  };
};
