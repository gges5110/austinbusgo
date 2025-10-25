import { useDataFromRouteLoader } from "app/Router";
import { routeLoader } from "features/route/pages/route/RouteLoader";
import { useAtom } from "jotai";
import { searchParamsDataLoader } from "pages/SearchParamsDataLoader";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { currentRouteAtom } from "shared/state/atoms";
import { Route } from "shared/types/interface.d";

export const useCurrentRoute = () => {
  const [currentRoute, setCurrentRoute] = useAtom(currentRouteAtom);
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();

  // Derive route from loaders
  const routeData = useDataFromRouteLoader("route", routeLoader);
  const searchParamsData = useDataFromRouteLoader(
    "searchParams",
    searchParamsDataLoader
  );
  const route = searchParamsData?.route || routeData?.route;

  // Sync derived route with atom
  useEffect(() => {
    setCurrentRoute(route);
  }, [route, setCurrentRoute]);

  const setRoute = (route: Route) => {
    if (route) {
      setCurrentRoute(route);
      navigate(`/route/${route?.routeId}/direction/0${viewStatePathname}`);
    }
  };

  return {
    currentRoute,
    setRoute,
  };
};
