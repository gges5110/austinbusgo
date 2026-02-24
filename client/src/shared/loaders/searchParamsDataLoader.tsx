import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "app/QueryClient";
import {
  NearByStopsQuery,
  useNearByStopsQuery,
} from "shared/api/schemas/NearByStops.generated";
import {
  RouteQuery,
  RouteQueryVariables,
  useRouteQuery,
} from "shared/api/schemas/Route.generated";
import {
  StopsAndShapesQuery,
  StopsAndShapesQueryVariables,
  useStopsAndShapesQuery,
} from "shared/api/schemas/StopsAndRouteShapes.generated";
import {
  useVehiclePositionsQuery,
  VehiclePositionsQuery,
  VehiclePositionsQueryVariables,
} from "shared/api/schemas/VehiclePositions.generated";
import { getDate } from "shared/utils/dateUtils";
import {
  computeBoundsFromViewState,
  parseViewStateFromPathname,
} from "shared/utils/viewStateUtils";

const routeQuery = (id: RouteQueryVariables) => ({
  queryKey: useRouteQuery.getKey(id),
  queryFn: useRouteQuery.fetcher(id),
});
const stopsAndShapesQuery = (id: StopsAndShapesQueryVariables) => ({
  queryKey: useStopsAndShapesQuery.getKey(id),
  queryFn: useStopsAndShapesQuery.fetcher(id),
});
const vehiclePositionsQuery = (id: VehiclePositionsQueryVariables) => ({
  queryKey: useVehiclePositionsQuery.getKey(id),
  queryFn: useVehiclePositionsQuery.fetcher(id),
});
export const searchParamsDataLoader = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const routeId = url.searchParams.get("routeId") || "";
  const directionId = Number(url.searchParams.get("directionId") || "");

  if (routeId === "") {
    const { latitude, longitude, zoom } = parseViewStateFromPathname(
      url.pathname
    );
    const bounds = computeBoundsFromViewState(
      latitude,
      longitude,
      zoom,
      window.innerWidth,
      window.innerHeight
    );
    const nearByStopsData = await queryClient.ensureQueryData<NearByStopsQuery>(
      {
        queryKey: useNearByStopsQuery.getKey(bounds),
        queryFn: useNearByStopsQuery.fetcher(bounds),
      }
    );
    return { nearByStops: nearByStopsData?.nearByStops ?? [] };
  }

  const routeDataQuery = queryClient.ensureQueryData<RouteQuery>(
    routeQuery({ routeId })
  );
  const stopsAndShapesDataQuery =
    queryClient.ensureQueryData<StopsAndShapesQuery>(
      stopsAndShapesQuery({
        routeId,
        directionId,
        date: getDate(),
      })
    );

  const vehiclePositionsDataQuery =
    queryClient.ensureQueryData<VehiclePositionsQuery>(
      vehiclePositionsQuery({
        routeId: routeId,
        direction: directionId,
      })
    );

  let routeData, stopsAndShapesData, vehiclePositionsData;
  if (routeId !== "") {
    routeData = await routeDataQuery;
    stopsAndShapesData = await stopsAndShapesDataQuery;
    vehiclePositionsData = await vehiclePositionsDataQuery;
  }

  return {
    route: routeData?.route,
    shapes: stopsAndShapesData?.stopsAndShapes.shapes,
    stops: stopsAndShapesData?.stopsAndShapes.stops,
    distinctTrips: stopsAndShapesData?.distinctTrips,
    vehiclePositions: vehiclePositionsData?.vehiclePositions,
  };
};
