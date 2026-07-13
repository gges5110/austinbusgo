import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "app/QueryClient";
import { redirect } from "react-router-dom";
import {
  getNearByStopsQueryOptions,
  getRoutesQueryOptions,
  getSearchQueryOptions,
} from "shared/api/generated/api";
import { SearchResult } from "shared/api/generated/model";

export interface SearchLoaderData {
  search: SearchResult;
}

export const searchLoader = async ({ params }: LoaderFunctionArgs) => {
  const searchTerm = decodeURIComponent(params["searchTerm"] || "");

  if (searchTerm.toLocaleLowerCase() === "All routes".toLocaleLowerCase()) {
    const routes = await queryClient.ensureQueryData(getRoutesQueryOptions());

    return {
      search: {
        stops: [],
        routes,
      },
    };
  } else if (
    searchTerm.toLocaleLowerCase() === "Nearby stops".toLocaleLowerCase()
  ) {
    // Parse the map center from the URL's view state segment
    // (@lat,lon,zoomz) — hooks can't be called inside loaders
    const viewStateMatch = /^@(-?[\d.]+),(-?[\d.]+),/.exec(
      params["viewState"] ?? ""
    );
    const latitude = viewStateMatch ? parseFloat(viewStateMatch[1]) : 30.2672;
    const longitude = viewStateMatch ? parseFloat(viewStateMatch[2]) : -97.7431;
    // ~2 km box around the map center
    const nearbyStops = await queryClient.ensureQueryData(
      getNearByStopsQueryOptions({
        min_lat: latitude - 0.02,
        min_lon: longitude - 0.02,
        max_lat: latitude + 0.02,
        max_lon: longitude + 0.02,
      })
    );

    return {
      search: {
        stops: nearbyStops,
        routes: [],
      },
    };
  }

  const searchData = await queryClient.ensureQueryData(
    getSearchQueryOptions({ q: searchTerm || "" })
  );

  const length = searchData.stops.length + searchData.routes.length;
  if (length === 1) {
    const viewStateMatch = params["viewState"];
    const viewStatePathname = viewStateMatch ? `/${viewStateMatch}` : "";

    if (searchData.stops.length) {
      return redirect(
        `/stop/${searchData.stops[0].stopId}${viewStatePathname}`
      );
    } else if (searchData.routes.length) {
      return redirect(
        `/route/${searchData.routes[0].routeId}/direction/0${viewStatePathname}`
      );
    }
  }

  return { search: searchData };
};
