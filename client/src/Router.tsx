import { StopQuery } from "./schemas/Stop.generated";
import { RouteQuery } from "./schemas/Route.generated";
import { StopsAndShapesQuery } from "./schemas/StopsAndRouteShapes.generated";
import {
  createBrowserRouter,
  createRoutesFromElements,
  LoaderFunction,
  Route,
  useLoaderData,
  useRouteLoaderData,
} from "react-router-dom";
import { RootLayout } from "./pages/page/RootLayout";
import { routesLoader, RootSearchMenu } from "./pages/page/RootSearchMenu";
import { routeLoader, RouteMenu } from "./pages/page/route/RouteMenu";
import { stopLoader, StopMenu } from "./pages/page/stop/StopMenu";
import { tripLoader, TripMenu } from "./pages/page/trip/TripMenu";
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

export const useDataFromRouteLoader = <LoaderFn extends LoaderFunction>(
  routeId: string,
  loaderFn: LoaderFn
): Awaited<ReturnType<typeof loaderFn>> | undefined => {
  return useRouteLoaderData(routeId) as Awaited<ReturnType<typeof loaderFn>>;
};

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={"/"} element={<RootLayout />}>
      <Route
        path={"/:viewState?"}
        element={<RootSearchMenu />}
        loader={routesLoader}
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
