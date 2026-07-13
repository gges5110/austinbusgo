import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "app/QueryClient";
import {
  getRouteQueryOptions,
  getStopsAndShapesQueryOptions,
  getVehiclePositionsQueryOptions,
} from "shared/api/generated/api";
import { getDate } from "shared/utils/dateUtils";

export const searchParamsDataLoader = async ({
  request,
}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const routeId = url.searchParams.get("routeId") || "";
  const directionId = Number(url.searchParams.get("directionId") || "");

  if (routeId === "") {
    return {};
  }

  const routeDataQuery = queryClient.ensureQueryData(
    getRouteQueryOptions(routeId)
  );
  const stopsAndShapesDataQuery = queryClient.ensureQueryData(
    getStopsAndShapesQueryOptions(routeId, {
      direction_id: directionId,
      date: getDate(),
    })
  );
  const vehiclePositionsDataQuery = queryClient.ensureQueryData(
    getVehiclePositionsQueryOptions({
      route_id: routeId,
      direction: directionId,
    })
  );

  const routeData = await routeDataQuery;
  const stopsAndShapesData = await stopsAndShapesDataQuery;
  const vehiclePositionsData = await vehiclePositionsDataQuery;

  return {
    route: routeData,
    shapes: stopsAndShapesData.shapes,
    stops: stopsAndShapesData.stops,
    distinctTrips: stopsAndShapesData.distinctTrips,
    vehiclePositions: vehiclePositionsData,
  };
};
