import { ViewState } from "features/map/components/Map";
import { useMap } from "react-map-gl/mapbox";
import { useRouteLoaderData } from "react-router-dom";
import { useNearByStopsQuery } from "shared/api/schemas/NearByStops.generated";
import { useDebounce } from "shared/hooks/useDebounce";
import { searchParamsDataLoader } from "shared/loaders/searchParamsDataLoader";
import { Stop } from "shared/types/interface.d";

type SearchParamsLoaderData = Awaited<
  ReturnType<typeof searchParamsDataLoader>
>;

export const useNearByStops = (viewState?: ViewState) => {
  const { mapId: map } = useMap();
  const loaderData = useRouteLoaderData("searchParams") as
    | SearchParamsLoaderData
    | undefined;
  const preloadedStops =
    loaderData && "nearByStops" in loaderData
      ? loaderData.nearByStops
      : undefined;

  const limit = viewState
    ? viewState.zoom <= 11
      ? 40
      : viewState.zoom <= 14
        ? 80
        : 100
    : 40;

  const bounds = map?.getBounds();
  const minLat = bounds?.getSouth();
  const minLon = bounds?.getWest();
  const maxLat = bounds?.getNorth();
  const maxLon = bounds?.getEast();

  const hasBounds =
    minLat !== undefined &&
    minLon !== undefined &&
    maxLat !== undefined &&
    maxLon !== undefined;
  const shouldFetch = viewState !== undefined && hasBounds;

  const debouncedQueryParams = useDebounce(
    {
      minLat: minLat ?? 0,
      minLon: minLon ?? 0,
      maxLat: maxLat ?? 0,
      maxLon: maxLon ?? 0,
      limit,
    },
    500
  );

  const { data, isFetching } = useNearByStopsQuery(debouncedQueryParams, {
    enabled: shouldFetch,
    keepPreviousData: true,
    placeholderData: preloadedStops
      ? { nearByStops: preloadedStops }
      : undefined,
  });

  const isLoading = isFetching;

  const nearByStops: Stop[] =
    shouldFetch || preloadedStops
      ? (data?.nearByStops ?? preloadedStops ?? [])
      : [];

  return {
    isLoading,
    nearByStops,
  };
};
