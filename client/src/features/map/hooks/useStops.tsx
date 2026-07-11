import { useDataFromRouteLoader } from "app/Router";
import { useAllStops } from "features/map/hooks/useAllStops";
import { routeLoader } from "features/route/pages/route/RouteLoader";
import { searchLoader } from "features/search/pages/search/SearchLoader";
import { isResponse } from "features/search/pages/search/SearchResultsMenu";
import { useMemo } from "react";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import { searchParamsDataLoader } from "shared/loaders/searchParamsDataLoader";
import { Stop } from "shared/types/interface.d";

// Stable empty array so the memos below don't recompute on every render
const NO_STOPS: Stop[] = [];

/** Deduplicates stops by stopId; on duplicates the later stop wins. */
const uniqueById = (stops: Stop[]): Stop[] => {
  const byId = new Map<string, Stop>();
  for (const stop of stops) {
    byId.set(stop.stopId, stop);
  }
  return [...byId.values()];
};

export const useStops = () => {
  const { currentStop } = useCurrentStop();

  const routeData = useDataFromRouteLoader("route", routeLoader);
  const searchParamsData = useDataFromRouteLoader(
    "searchParams",
    searchParamsDataLoader
  );
  const searchData = useDataFromRouteLoader("search", searchLoader);

  // Aggregate stops from multiple sources
  const routeStops = (searchParamsData?.stops ||
    routeData?.stops ||
    NO_STOPS) as Stop[];
  const searchStops = (
    searchData !== undefined && !isResponse(searchData)
      ? searchData.search.stops
      : NO_STOPS
  ) as Stop[];

  // Stops from the current route / search / selected stop context
  const contextStops = useMemo(
    () =>
      uniqueById([
        ...routeStops,
        ...searchStops,
        ...(currentStop !== undefined ? [currentStop] : []),
      ]),
    [routeStops, searchStops, currentStop]
  );

  // Only show the full stops layer when no route or search context stops
  // are present
  const { allStops } = useAllStops(contextStops.length === 0);

  const stops = useMemo(
    () => uniqueById([...contextStops, ...allStops]),
    [contextStops, allStops]
  );

  return { stops, contextStops };
};
