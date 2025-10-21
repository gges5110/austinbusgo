import {
  StopsAndShapesQuery,
  StopsAndShapesQueryVariables,
  useStopsAndShapesQuery,
} from "../../../../shared/api/schemas/StopsAndRouteShapes.generated";
import {
  RouteQuery,
  RouteQueryVariables,
  useRouteQuery,
} from "../../../../shared/api/schemas/Route.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "../../../../app/QueryClient";
import {
  useVehiclePositionsQuery,
  VehiclePositionsQuery,
  VehiclePositionsQueryVariables,
} from "../../../../shared/api/schemas/VehiclePositions.generated";
import { getDate } from "../../../../shared/utils/dateUtils";

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
export const routeLoader = async ({ params }: LoaderFunctionArgs) => {
  const routeId = params["routeId"] || "";
  const directionId = Number(params["directionId"]);
  const routeDataQuery = queryClient.ensureQueryData<RouteQuery>(
    routeQuery({ routeId })
  );
  const stopsAndShapesDataQuery = queryClient.ensureQueryData<
    StopsAndShapesQuery
  >(
    stopsAndShapesQuery({
      routeId,
      directionId,
      date: getDate(),
    })
  );

  const vehiclePositionsDataQuery = queryClient.ensureQueryData<
    VehiclePositionsQuery
  >(
    vehiclePositionsQuery({
      routeId: routeId,
      direction: directionId,
    })
  );

  const routeData = await routeDataQuery;
  const stopsAndShapesData = await stopsAndShapesDataQuery;
  const vehiclePositionsData = await vehiclePositionsDataQuery;

  return {
    route: routeData.route,
    shapes: (stopsAndShapesData as StopsAndShapesQuery).stopsAndShapes.shapes,
    stops: (stopsAndShapesData as StopsAndShapesQuery).stopsAndShapes.stops,
    distinctTrips: (stopsAndShapesData as StopsAndShapesQuery).distinctTrips,
    vehiclePositions: vehiclePositionsData?.vehiclePositions,
  };
};
