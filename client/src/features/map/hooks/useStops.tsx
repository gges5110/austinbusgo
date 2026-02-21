import { useDataFromRouteLoader } from "app/Router";
import { ViewState } from "features/map/components/Map";
import { useNearByStops } from "features/map/hooks/UseNearByStops";
import { routeLoader } from "features/route/pages/route/RouteLoader";
import { searchLoader } from "features/search/pages/search/SearchLoader";
import { isResponse } from "features/search/pages/search/SearchResultsMenu";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import { searchParamsDataLoader } from "shared/loaders/searchParamsDataLoader";
import { Stop } from "shared/types/interface.d";

export const useStops = (viewState?: ViewState) => {
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

  // Only show nearby stops when no route or search context stops are present
  const hasContextStops = routeStops.length > 0 || searchStops.length > 0;
  const { nearByStops } = useNearByStops(
    hasContextStops ? undefined : viewState
  );

  const stops = [
    ...routeStops,
    ...searchStops,
    ...currentStopArray,
    ...nearByStops,
  ] as Stop[];
  // Remove duplicate stops based on stopId
  const uniqueStopsMap: Record<string, Stop> = {};
  stops.forEach((stop) => {
    uniqueStopsMap[stop.stopId] = stop;
  });
  const uniqueStops = Object.values(uniqueStopsMap);

  const contextStopsMap: Record<string, Stop> = {};
  [...routeStops, ...searchStops, ...currentStopArray].forEach((stop) => {
    contextStopsMap[stop.stopId] = stop as Stop;
  });
  const uniqueContextStops = Object.values(contextStopsMap);

  return { stops: uniqueStops, contextStops: uniqueContextStops };
};
