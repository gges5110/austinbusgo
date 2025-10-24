import { useDataFromRouteLoader } from "app/Router";
import { routeLoader } from "features/route/pages/route/RouteLoader";
import { searchLoader } from "features/search/pages/search/SearchLoader";
import { isResponse } from "features/search/pages/search/SearchResultsMenu";
import { searchParamsDataLoader } from "pages/SearchParamsDataLoader";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import { Stop } from "shared/types/interface.d";

export const useStops = () => {
  const { currentStop } = useCurrentStop();

  const routeData = useDataFromRouteLoader("route", routeLoader);
  const searchParamsData = useDataFromRouteLoader(
    "searchParams",
    searchParamsDataLoader
  );
  const searchData = useDataFromRouteLoader("search", searchLoader);

  // Aggregate stops from multiple sources
  const routeStops = searchParamsData?.stops || routeData?.stops || [];
  const searchStops =
    searchData !== undefined && !isResponse(searchData)
      ? searchData?.search.stops
      : [];
  const currentStopArray = currentStop !== undefined ? [currentStop] : [];
  const stops = [...routeStops, ...searchStops, ...currentStopArray] as Stop[];

  return { stops };
};
