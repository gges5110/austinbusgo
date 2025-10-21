import {
  SearchQuery,
  SearchQueryVariables,
  useSearchQuery,
} from "../../../../shared/api/schemas/Search.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "../../../../app/QueryClient";
import {
  RoutesQuery,
  useRoutesQuery,
} from "../../../../shared/api/schemas/Routes.generated";
import {
  NearByStopsQuery,
  useNearByStopsQuery,
} from "../../../../shared/api/schemas/NearByStops.generated";
import { useViewStatePathname } from "../../../../shared/hooks/UseViewStatePathname";
import { redirect } from "react-router-dom";
import { FavoritesType } from "../../../../shared/state/atoms";
import { isRoute, isStop } from "../../components/SearchPanel/SearchPanel";
import { Route, Stop } from "../../../../shared/types/interface.d";

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
  } else if (
    searchTerm.toLocaleLowerCase() === "Favorites".toLocaleLowerCase()
  ) {
    const favoritesRawString = localStorage.getItem("favorites");
    if (!favoritesRawString) {
      return {
        search: {
          stops: [],
          routes: [],
        },
      };
    }

    const favorites = JSON.parse(favoritesRawString) as FavoritesType[];
    const favoriteStops = favorites.filter((favorite) =>
      isStop(favorite)
    ) as Stop[];
    const favoriteRoutes = favorites.filter((favorite) =>
      isRoute(favorite)
    ) as Route[];

    return {
      search: {
        stops: favoriteStops,
        routes: favoriteRoutes,
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
    const { viewStatePathname } = useViewStatePathname();

    if (searchData.search.stops.length) {
      return redirect(
        `${viewStatePathname}/stop/${searchData.search.stops[0].stopId}`
      );
    } else if (searchData.search.routes.length) {
      return redirect(
        `${viewStatePathname}/route/${searchData.search.routes[0].routeId}/direction/0`
      );
    }
  }

  return searchData;
};
