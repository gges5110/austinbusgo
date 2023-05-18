import {
  createBrowserRouter,
  createRoutesFromElements,
  LoaderFunction,
  Route,
  useLoaderData,
  useRouteLoaderData,
} from "react-router-dom";
import { RootLayout } from "./pages/RootLayout";
import { RouteMenu } from "./pages/route/RouteMenu";
import { StopMenu } from "./pages/stop/StopMenu";
import { TripMenu } from "./pages/trip/TripMenu";
import * as React from "react";
import { SearchResultsMenu } from "./pages/search/SearchResultsMenu";
import { routeLoader } from "./pages/route/RouteLoader";
import { stopLoader } from "./pages/stop/StopLoader";
import { tripLoader } from "./pages/trip/TripLoader";
import { searchLoader } from "./pages/search/SearchLoader";
import { searchParamsDataLoader } from "./pages/SearchParamsDataLoader";

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
    <Route
      path={"/:viewState?"}
      id={"searchParams"}
      loader={searchParamsDataLoader}
      element={<RootLayout />}
    >
      <Route
        path={"/:viewState/search/:searchTerm"}
        element={<SearchResultsMenu />}
        id={"search"}
        loader={searchLoader}
      ></Route>
      <Route path={"/:viewState/stop/:stopId"} id={"stop"} loader={stopLoader}>
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
  )
);
