import { useNavigate } from "react-router-dom";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { Route, Stop } from "shared/types/interface.d";

import {
  isRoute,
  isSearchTerm,
  isStop,
  SearchOption,
  SearchTerm,
} from "./searchPanelUtils";

interface UseSearchNavigationParams {
  route?: Route;
  setRoute: (route: Route) => void;
  setStop: (stop: Stop) => void;
  addToRecentSearches: (value: Route | Stop) => void;
  inputString: string;
  ref: React.RefObject<HTMLInputElement>;
}

export const useSearchNavigation = ({
  route,
  setRoute,
  setStop,
  addToRecentSearches,
  inputString,
  ref,
}: UseSearchNavigationParams) => {
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();

  const goToSearchPage = (searchTerm?: SearchTerm) => {
    ref?.current?.blur?.();
    const value = searchTerm?.value || inputString.trim();
    navigate(`${viewStatePathname}/search/${encodeURIComponent(value)}`);
  };

  const handleSearchChange = (
    event: React.SyntheticEvent,
    newValue: SearchOption | null
  ) => {
    if (newValue != null) {
      const { optionValue } = newValue;
      if (isRoute(optionValue)) {
        if (route?.routeId !== optionValue.routeId) {
          setRoute(optionValue);
          addToRecentSearches(optionValue);
        }
      } else if (isStop(optionValue)) {
        setStop(optionValue);
        addToRecentSearches(optionValue);
      } else if (isSearchTerm(optionValue)) {
        goToSearchPage(optionValue);
      }
    }
  };

  const clearSelection = () => {
    navigate(viewStatePathname);
  };

  return {
    handleSearchChange,
    goToSearchPage,
    clearSelection,
  };
};
