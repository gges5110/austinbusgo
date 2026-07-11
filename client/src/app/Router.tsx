import { DevLayout } from "features/dev/components/DevLayout";
import { StopsDevPage } from "features/dev/pages/StopsDevPage";
import { TripStopTimesDevPage } from "features/dev/pages/TripStopTimesDevPage";
import { VehiclePositionsDevPage } from "features/dev/pages/VehiclePositionsDevPage";
import { FavoritesMenu } from "features/favorites/pages/FavoritesMenu";
import { RootLayout } from "features/layout/RootLayout";
import { routeLoader } from "features/route/pages/route/RouteLoader";
import { RouteMenu } from "features/route/pages/route/RouteMenu";
import { RecentSearchesMenu } from "features/search/pages/recent/RecentSearchesMenu";
import { searchLoader } from "features/search/pages/search/SearchLoader";
import { SearchResultsMenu } from "features/search/pages/search/SearchResultsMenu";
import { stopLoader } from "features/stop/pages/stop/StopLoader";
import { StopMenu } from "features/stop/pages/stop/StopMenu";
import { tripLoader } from "features/trip/pages/trip/TripLoader";
import { TripMenu } from "features/trip/pages/trip/TripMenu";
import * as React from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  LoaderFunction,
  Route,
  useLoaderData,
  useRouteLoaderData,
} from "react-router-dom";
import { RouteErrorFallback } from "shared/components/RouteErrorFallback";
import { searchParamsDataLoader } from "shared/loaders/searchParamsDataLoader";

// Lazy-loaded so gtfs-realtime-bindings (protobufjs) stays out of the main
// bundle; the POC page is the only consumer.
const GtfsRtFrontendDevPage = React.lazy(() =>
  import("features/dev/pages/GtfsRtFrontendDevPage").then((m) => ({
    default: m.GtfsRtFrontendDevPage,
  }))
);

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
      <Route element={<DevLayout />} path={"/dev"}>
        <Route element={<VehiclePositionsDevPage />} path={"vehicles"} />
        <Route element={<TripStopTimesDevPage />} path={"trip-stop-times"} />
        <Route element={<StopsDevPage />} path={"stops"} />
        <Route
          element={
            <React.Suspense fallback={null}>
              <GtfsRtFrontendDevPage />
            </React.Suspense>
          }
          path={"gtfs-rt-frontend"}
        />
      </Route>
      <Route
        element={<RootLayout />}
        id={"searchParams"}
        loader={searchParamsDataLoader}
        path={"/"}
      >
        <Route
          element={<SearchResultsMenu />}
          errorElement={<RouteErrorFallback />}
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
          errorElement={<RouteErrorFallback />}
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
            errorElement={<RouteErrorFallback />}
            loader={tripLoader}
            path={"trip/:tripId/:viewState?"}
          ></Route>
        </Route>
        <Route
          element={<RouteMenu />}
          errorElement={<RouteErrorFallback />}
          id={"route"}
          loader={routeLoader}
          path={"route/:routeId/direction/:directionId/:viewState?"}
        ></Route>
        <Route path={"/:viewState"} />
      </Route>
    </>
  )
);
