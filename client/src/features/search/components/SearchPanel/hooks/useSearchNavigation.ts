import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentRoute } from "shared/hooks/UseCurrentRoute";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";

import { SearchOption } from "./searchPanelUtils";

export const useSearchNavigation = () => {
  const navigate = useNavigate();
  const { currentRoute, setRoute } = useCurrentRoute();
  const { setStop } = useCurrentStop();
  const { viewStatePathname } = useViewStatePathname();
  const { addToRecentSearches } = useRecentSearches();

  const handleSearch = useCallback(
    (searchTerm: string) => {
      navigate(`/search/${encodeURIComponent(searchTerm)}${viewStatePathname}`);
    },
    [navigate, viewStatePathname]
  );

  const handleSelect = useCallback(
    (option: SearchOption) => {
      switch (option.kind) {
        case "route":
          if (currentRoute?.routeId !== option.route.routeId) {
            setRoute(option.route);
            addToRecentSearches(option.route);
          }
          break;
        case "stop":
          setStop(option.stop);
          addToRecentSearches(option.stop);
          break;
        case "term":
          handleSearch(option.term);
          break;
        case "viewAll":
          navigate(`/recent-searches${viewStatePathname}`);
          break;
      }
    },
    [
      currentRoute,
      setRoute,
      setStop,
      addToRecentSearches,
      handleSearch,
      navigate,
      viewStatePathname,
    ]
  );

  const handleClear = useCallback(() => {
    navigate(viewStatePathname || "/");
  }, [navigate, viewStatePathname]);

  return {
    handleSelect,
    handleClear,
    handleSearch,
  };
};
