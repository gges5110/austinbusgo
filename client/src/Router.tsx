import { StopQuery } from "./schemas/Stop.generated";
import { RouteQuery } from "./schemas/Route.generated";
import { StopsAndShapesQuery } from "./schemas/StopsAndRouteShapes.generated";
import {
  createBrowserRouter,
  createRoutesFromElements,
  LoaderFunction,
  Route,
  useLoaderData,
} from "react-router-dom";
import { RootLayout } from "./pages/page/RootLayout";
import { routesLoader, RoutesMenu } from "./pages/page/routes/RoutesMenu";
import { routeLoader, RouteMenu } from "./pages/page/routes/route/RouteMenu";
import { stopLoader, StopMenu } from "./pages/page/routes/route/stop/StopMenu";
import { tripLoader, TripMenu } from "./pages/trip/TripMenu";
import { stopsLoader, StopsMenu } from "./pages/page/routes/StopsMenu";
import * as React from "react";
import { ApolloClient, InMemoryCache } from "@apollo/client";

export const client = new ApolloClient({
  uri:
    process.env.REACT_APP_API_BASE !== undefined
      ? `${process.env.REACT_APP_API_BASE}/graphql`
      : "/graphql",
  cache: new InMemoryCache(),
});

export const useDataFromLoader = <LoaderFn extends LoaderFunction>(
  loaderFn: LoaderFn
): Awaited<ReturnType<typeof loaderFn>> =>
  useLoaderData() as Awaited<ReturnType<typeof loaderFn>>;
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={"/"} element={<RootLayout />}>
      <Route
        path={"/:viewState?"}
        element={<RoutesMenu />}
        loader={routesLoader}
      >
        <Route
          path={"/:viewState/routes/:routeId/direction/:directionId"}
          loader={routeLoader}
          handle={{
            route: (data: Awaited<ReturnType<typeof routeLoader>>) =>
              data.route,
            stops: (data: Awaited<ReturnType<typeof routeLoader>>) =>
              data.stops,
            shapes: (data: Awaited<ReturnType<typeof routeLoader>>) =>
              data.shapes,
          }}
        >
          <Route
            index={true}
            element={<RouteMenu />}
            loader={routeLoader}
          ></Route>
          <Route
            path={
              "/:viewState/routes/:routeId/direction/:directionId/stops/:stopId"
            }
            loader={stopLoader}
            handle={{
              stop: (data: Awaited<ReturnType<typeof stopLoader>>) =>
                data.data.stop,
            }}
          >
            <Route
              path={
                "/:viewState/routes/:routeId/direction/:directionId/stops/:stopId"
              }
              index={true}
              element={<StopMenu />}
              loader={stopLoader}
            ></Route>
            <Route
              path={
                "/:viewState/routes/:routeId/direction/:directionId/stops/:stopId/trips/:tripId"
              }
              loader={tripLoader}
              element={<TripMenu />}
            ></Route>
          </Route>
        </Route>
      </Route>
      <Route
        path={"/:viewState/stops"}
        loader={stopsLoader}
        element={<StopsMenu />}
      >
        <Route
          path={"/:viewState/stops/:stopId"}
          id={"stop"}
          loader={stopLoader}
          handle={{
            stop: (data: Awaited<ReturnType<typeof stopLoader>>) =>
              data.data.stop,
          }}
        >
          <Route
            path={"/:viewState/stops/:stopId"}
            index={true}
            element={<StopMenu />}
            loader={stopLoader}
          ></Route>
          <Route
            path={"/:viewState/stops/:stopId/trips/:tripId"}
            loader={tripLoader}
            element={<TripMenu />}
          ></Route>
        </Route>
      </Route>
    </Route>
  )
);

export interface HandleType {
  stop?: (data: Awaited<ReturnType<typeof stopLoader>>) => StopQuery["stop"];
  route?: (
    data: Awaited<ReturnType<typeof routeLoader>>
  ) => RouteQuery["route"];
  stops?: (
    data: Awaited<ReturnType<typeof routeLoader>>
  ) => StopsAndShapesQuery["stopsAndShapes"]["stops"];
  shapes?: (
    data: Awaited<ReturnType<typeof routeLoader>>
  ) => StopsAndShapesQuery["stopsAndShapes"]["shapes"];
}
