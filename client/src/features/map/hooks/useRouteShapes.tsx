import { useDataFromRouteLoader } from "app/Router";
import { routeLoader } from "features/route/pages/route/RouteLoader";
import { searchParamsDataLoader } from "shared/loaders/searchParamsDataLoader";
import { LineString } from "shared/types/interface.d";

// Stable empty array so consumers' memos/effects don't refire on every render
const NO_SHAPES: LineString[] = [];

export const useRouteShapes = () => {
  const routeData = useDataFromRouteLoader("route", routeLoader);
  const searchParamsData = useDataFromRouteLoader(
    "searchParams",
    searchParamsDataLoader
  );

  // Get route shapes from loaders (prefer searchParamsData for prefetched data)
  const routeShapes: LineString[] =
    searchParamsData?.shapes || routeData?.shapes || NO_SHAPES;

  return { routeShapes };
};
