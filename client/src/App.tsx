import { ThemeProvider } from "@mui/material";
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
            id={"route"}
            loader={routeLoader}
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
              id={"stopOnRoute"}
              element={<StopMenu />}
              loader={stopLoader}
            ></Route>
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
            element={<StopMenu />}
            loader={stopLoader}
          ></Route>
        </Route>
      </Route>
    )
  );

  return (
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
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
