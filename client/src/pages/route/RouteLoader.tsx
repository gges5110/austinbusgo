import {
  StopsAndShapesQuery,
  StopsAndShapesQueryVariables,
  useStopsAndShapesQuery,
} from "../../schemas/StopsAndRouteShapes.generated";
import {
  RouteQuery,
  RouteQueryVariables,
  useRouteQuery,
} from "../../schemas/Route.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "../../QueryClient";
import { getDate } from "../RootLayout";

const routeQuery = (id: RouteQueryVariables) => ({
  queryKey: useRouteQuery.getKey(id),
  queryFn: useRouteQuery.fetcher(id),
});
const stopsAndShapesQuery = (id: StopsAndShapesQueryVariables) => ({
  queryKey: useStopsAndShapesQuery.getKey(id),
  queryFn: useStopsAndShapesQuery.fetcher(id),
});
export const routeLoader = async ({ params }: LoaderFunctionArgs) => {
  const routeId = params["routeId"] || "";
  const directionId = Number(params["directionId"]);

  const routeData = await queryClient.ensureQueryData<RouteQuery>(
    routeQuery({ routeId })
  );
  const stopsAndShapesData = await queryClient.ensureQueryData<
    StopsAndShapesQuery
  >(
    stopsAndShapesQuery({
      routeId,
      directionId,
      date: getDate(),
    })
  );

  return {
    route: routeData.route,
    shapes: (stopsAndShapesData as StopsAndShapesQuery).stopsAndShapes.shapes,
    stops: (stopsAndShapesData as StopsAndShapesQuery).stopsAndShapes.stops,
    distinctTrips: (stopsAndShapesData as StopsAndShapesQuery).distinctTrips,
  };
};
