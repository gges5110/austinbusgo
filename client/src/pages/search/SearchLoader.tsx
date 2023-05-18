import {
  SearchQuery,
  SearchQueryVariables,
  useSearchQuery,
} from "../../schemas/Search.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "../../QueryClient";
import { RoutesQuery, useRoutesQuery } from "../../schemas/Routes.generated";
import {
  NearByStopsQuery,
  useNearByStopsQuery,
} from "../../schemas/NearByStops.generated";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";

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

  return queryClient.ensureQueryData<SearchQuery>(
    searchQuery({
      searchTerm: searchTerm || "",
    })
  );
};
