import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import { Route, Stop } from "shared/types/interface.d";

import {
  isRoute,
  isSearchTerm,
  isStop,
  SearchOption,
} from "./searchPanelUtils";

interface UseSearchNavigationParams {
  route?: Route;
  setRoute: (route: Route) => void;
  setStop: (stop: Stop) => void;
  viewStatePathname: string;
}

export const useSearchNavigation = ({
  route,
  setRoute,
  setStop,
  viewStatePathname,
}: UseSearchNavigationParams) => {
  const navigate = useNavigate();
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
        if (route?.routeId !== optionValue.routeId) {
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
    [route, setRoute, setStop, addToRecentSearches, handleSearch]
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
