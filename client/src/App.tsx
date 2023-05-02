import { CssBaseline, ThemeProvider } from "@mui/material";
import * as React from "react";
import { getDate, Page, toBoolean } from "./pages/page/Page";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { SnackbarProvider } from "notistack";
import {
  createBrowserRouter,
  createRoutesFromElements,
  LoaderFunction,
  Route,
  RouterProvider,
  useLoaderData,
  useRouteLoaderData,
} from "react-router-dom";
import { theme } from "./Theming";
import {
  RouteDocument,
  RouteQuery,
  RouteQueryVariables,
} from "./schemas/Route.generated";
import {
  StopsAndShapesDocument,
  StopsAndShapesQuery,
  StopsAndShapesQueryVariables,
} from "./schemas/StopsAndRouteShapes.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  StopDocument,
  StopQuery,
  StopQueryVariables,
} from "./schemas/Stop.generated";
import { RouteMenu } from "./pages/page/routes/route/RouteMenu";
import { StopMenu } from "./pages/page/routes/route/stop/StopMenu";

import { RoutesMenu } from "./pages/page/routes/RoutesMenu";
import { RoutesDocument, RoutesQuery } from "./schemas/Routes.generated";
import {
  StopsByNameDocument,
  StopsByNameQuery,
  StopsByNameQueryVariables,
} from "./schemas/StopsByName.generated";
import { StopsMenu } from "./pages/page/routes/StopsMenu";
import {
  TripDocument,
  TripQuery,
  TripQueryVariables,
} from "./schemas/Trip.generated";
import {
  StopTimesDocument,
  StopTimesQuery,
  StopTimesQueryVariables,
} from "./schemas/StopTimes.generated";
import dayjs from "dayjs";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { TripMenu } from "./pages/trip/TripMenu";

dayjs.extend(LocalizedFormat);

const client = new ApolloClient({
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

export const stopsLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  let stopsByName = undefined;
  if (q) {
    stopsByName = await client.query<
      StopsByNameQuery,
      StopsByNameQueryVariables
    >({
      query: StopsByNameDocument,
      variables: {
        stopName: q,
      },
    });
  }

  return {
    stopsByName,
    q,
  };
};

export const routesLoader = async () => {
  return await client.query<RoutesQuery>({ query: RoutesDocument });
};

export const stopLoader = async ({ params }: LoaderFunctionArgs) => {
  const stopId = params["stopId"];
  return await client.query<StopQuery, StopQueryVariables>({
    query: StopDocument,
    variables: {
      stopId: stopId || "0",
    },
  });
};

export const tripLoader = async ({ params }: LoaderFunctionArgs) => {
  const tripId = params["tripId"];
  const { data: stopTimesData } = await client.query<
    StopTimesQuery,
    StopTimesQueryVariables
  >({
    query: StopTimesDocument,
    variables: {
      tripId: tripId || "",
    },
  });

  const { data: tripData } = await client.query<TripQuery, TripQueryVariables>({
    query: TripDocument,
    variables: {
      tripId: tripId || "",
    },
  });

  return {
    trip: tripData.trip,
    stopTimes: stopTimesData.stopTimes,
  };
};

export const routeLoader = async ({ params }: LoaderFunctionArgs) => {
  const routeId = Number(params["routeId"]);
  const directionId = toBoolean(params["directionId"]);
  const { data: routeData } = await client.query<
    RouteQuery,
    RouteQueryVariables
  >({
    query: RouteDocument,
    variables: {
      routeId,
    },
  });

  const { data: stopsAndShapesData } = await client.query<
    StopsAndShapesQuery,
    StopsAndShapesQueryVariables
  >({
    query: StopsAndShapesDocument,
    variables: {
      routeId,
      directionId,
      date: getDate(),
    },
  });
  return {
    route: routeData.route,
    shapes: stopsAndShapesData.stopsAndShapes.shapes,
    stops: stopsAndShapesData.stopsAndShapes.stops,
    distinctTrips: stopsAndShapesData.distinctTrips,
  };
};

export const App: React.FunctionComponent = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path={"/"} element={<Page />}>
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
              element={<StopMenu hideBackButton={true} />}
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

  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          preventDuplicate={true}
          autoHideDuration={2000}
        >
          <RouterProvider router={router} />
        </SnackbarProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
};

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
