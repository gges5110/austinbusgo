import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "app/QueryClient";
import { redirect } from "react-router-dom";
import {
  NearByStopsQuery,
  useNearByStopsQuery,
} from "shared/api/schemas/NearByStops.generated";
import {
  RoutesQuery,
  useRoutesQuery,
} from "shared/api/schemas/Routes.generated";
import {
  SearchQuery,
  SearchQueryVariables,
  useSearchQuery,
} from "shared/api/schemas/Search.generated";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";

const searchQuery = (id: SearchQueryVariables) => ({
  queryKey: useSearchQuery.getKey(id),
  queryFn: useSearchQuery.fetcher(id),
});
export const searchLoader = async ({ params }: LoaderFunctionArgs) => {
  const searchTerm = decodeURIComponent(params["searchTerm"] || "");

  if (searchTerm.toLocaleLowerCase() === "All routes".toLocaleLowerCase()) {
    const routesData = await queryClient.ensureQueryData<RoutesQuery>({
      queryKey: ["Routes"],
      queryFn: useRoutesQuery.fetcher(),
    });

    return {
      search: {
        stops: [],
        routes: routesData.routes,
      },
    };
  } else if (
    searchTerm.toLocaleLowerCase() === "Nearby stops".toLocaleLowerCase()
  ) {
    const { latitude, longitude } = useViewStatePathname();
    const variables = {
      lat: latitude,
      lon: longitude,
    };

    const nearbyStopsData = await queryClient.ensureQueryData<NearByStopsQuery>(
      {
        queryKey: ["NearByStops"],
        queryFn: useNearByStopsQuery.fetcher(variables),
      }
    );

    return {
      search: {
        stops: nearbyStopsData.nearByStops,
        routes: [],
      },
    };
  }

  const searchData = await queryClient.ensureQueryData<SearchQuery>(
    searchQuery({
      searchTerm: searchTerm || "",
    })
  );

  const length =
    searchData.search.stops.length + searchData.search.routes.length;
  if (length === 1) {
    const viewStateMatch = params["viewState"];
    const viewStatePathname = viewStateMatch ? `/${viewStateMatch}` : "";

    if (searchData.search.stops.length) {
      return redirect(
        `/stop/${searchData.search.stops[0].stopId}${viewStatePathname}`
      );
    } else if (searchData.search.routes.length) {
      return redirect(
        `/route/${searchData.search.routes[0].routeId}/direction/0${viewStatePathname}`
      );
    }
  }

  return searchData;
};
