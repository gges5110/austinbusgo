import { VehiclePositionsDevPage } from "features/dev/pages/VehiclePositionsDevPage";
import { FavoritesMenu } from "features/favorites/pages/FavoritesMenu";
import { routeLoader } from "features/route/pages/route/RouteLoader";
import { RouteMenu } from "features/route/pages/route/RouteMenu";
import { RecentSearchesMenu } from "features/search/pages/recent/RecentSearchesMenu";
import { searchLoader } from "features/search/pages/search/SearchLoader";
import { SearchResultsMenu } from "features/search/pages/search/SearchResultsMenu";
import { stopLoader } from "features/stop/pages/stop/StopLoader";
import { StopMenu } from "features/stop/pages/stop/StopMenu";
import { tripLoader } from "features/trip/pages/trip/TripLoader";
import { TripMenu } from "features/trip/pages/trip/TripMenu";
import { RootLayout } from "pages/RootLayout";
import { searchParamsDataLoader } from "pages/SearchParamsDataLoader";
import * as React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  LoaderFunction,
  Route,
  useLoaderData,
  useRouteLoaderData,
} from "react-router-dom";

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
    <>
      <Route element={<VehiclePositionsDevPage />} path={"/dev/vehicles"} />
      <Route
        element={<RootLayout />}
        id={"searchParams"}
        loader={searchParamsDataLoader}
        path={"/"}
      >
        <Route
          element={<SearchResultsMenu />}
          id={"search"}
          loader={searchLoader}
          path={"search/:searchTerm/:viewState?"}
        ></Route>
        <Route
          element={<RecentSearchesMenu />}
          path={"recent-searches/:viewState?"}
        ></Route>
        <Route
          element={<FavoritesMenu />}
          path={"favorites/:viewState?"}
        ></Route>
        <Route
          id={"stop"}
          loader={stopLoader}
          path={"stop/:stopId/:viewState?"}
        >
          <Route
            element={<StopMenu />}
            index={true}
            loader={stopLoader}
          ></Route>
          <Route
            element={<TripMenu />}
            loader={tripLoader}
            path={"trip/:tripId/:viewState?"}
          ></Route>
        </Route>
        <Route
          element={<RouteMenu />}
          id={"route"}
          loader={routeLoader}
          path={"route/:routeId/direction/:directionId/:viewState?"}
        ></Route>
        <Route path={"/:viewState"} />
      </Route>
    </>
  )
);
