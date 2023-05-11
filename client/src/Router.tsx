import {
  createBrowserRouter,
  createRoutesFromElements,
  LoaderFunction,
  Route,
  useLoaderData,
  useRouteLoaderData,
} from "react-router-dom";
import { RootLayout, routeSearchParamsLoader } from "./pages/RootLayout";
import { routeLoader, RouteMenu } from "./pages/route/RouteMenu";
import { stopLoader, StopMenu } from "./pages/stop/StopMenu";
import { tripLoader, TripMenu } from "./pages/trip/TripMenu";
import * as React from "react";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import {
  searchLoader,
  SearchResultsMenu,
} from "./pages/search/SearchResultsMenu";

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
        id={"routeSearchParams"}
        loader={routeSearchParamsLoader}
      >
        <Route
          path={"/:viewState/search/:searchTerm"}
          element={<SearchResultsMenu />}
          loader={searchLoader}
        ></Route>
        <Route
          path={"/:viewState/stop/:stopId"}
          id={"stop"}
          loader={stopLoader}
        >
          <Route
            path={"/:viewState/stop/:stopId"}
            index={true}
            element={<StopMenu />}
            loader={stopLoader}
          ></Route>
          <Route
            path={"/:viewState/stop/:stopId/trip/:tripId"}
            loader={tripLoader}
            element={<TripMenu />}
          ></Route>
        </Route>
        <Route
          path={"/:viewState/route/:routeId/direction/:directionId"}
          element={<RouteMenu />}
          id={"route"}
          loader={routeLoader}
        ></Route>
      </Route>
    </Route>
  )
);
