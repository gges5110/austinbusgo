import {
  StopsAndShapesQuery,
  StopsAndShapesQueryVariables,
  useStopsAndShapesQuery,
} from "../schemas/StopsAndRouteShapes.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "../QueryClient";
import {
  RouteQuery,
  RouteQueryVariables,
  useRouteQuery,
} from "../schemas/Route.generated";
import {
  useVehiclePositionsQuery,
  VehiclePositionsQuery,
  VehiclePositionsQueryVariables,
} from "../schemas/VehiclePositions.generated";
import { getDate } from "./RootLayout";

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
export const rootLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const routeId = url.searchParams.get("routeId") || "";
  const directionId = Number(url.searchParams.get("directionId") || "");

  if (routeId === "") {
    return {};
  }

  const rq = queryClient.ensureQueryData<RouteQuery>(routeQuery({ routeId }));
  const sq = queryClient.ensureQueryData<StopsAndShapesQuery>(
    stopsAndShapesQuery({
      routeId,
      directionId,
      date: getDate(),
    })
  );

  const vq = queryClient.ensureQueryData<VehiclePositionsQuery>({
    ...vehiclePositionsQuery({
      routeId: routeId,
      direction: directionId,
    }),
  });

  let routeData, stopsAndShapesData, vehiclePositionsData;
  if (routeId !== "") {
    routeData = await rq;
    stopsAndShapesData = await sq;
    vehiclePositionsData = await vq;
  }

  return {
    route: routeData?.route,
    shapes: stopsAndShapesData?.stopsAndShapes.shapes,
    stops: stopsAndShapesData?.stopsAndShapes.stops,
    distinctTrips: stopsAndShapesData?.distinctTrips,
    vehiclePositions: vehiclePositionsData?.vehiclePositions,
  };
};
