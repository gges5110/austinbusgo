import { useMap } from "react-map-gl/mapbox";
import { useNearByStopsQuery } from "shared/api/schemas/NearByStops.generated";
import { useDebounce } from "shared/hooks/useDebounce";
import { Stop } from "shared/types/interface.d";

const STOPS_LIMIT = 300;

// Stable empty array so consumers' memos don't recompute on every render
const NO_STOPS: Stop[] = [];

/**
 * Fetches stops within the current map bounds, debounced so panning doesn't
 * fire a query per frame. Bounds are read from the map on each render (the
 * parent re-renders on every map move, keeping them fresh).
 */
export const useNearByStops = (enabled: boolean) => {
  const { mapId: map } = useMap();

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
  const shouldFetch = enabled && hasBounds;

  const debouncedQueryParams = useDebounce(
    {
      minLat: minLat ?? 0,
      minLon: minLon ?? 0,
      maxLat: maxLat ?? 0,
      maxLon: maxLon ?? 0,
      limit: STOPS_LIMIT,
    },
    500
  );

  const { data, isFetching } = useNearByStopsQuery(debouncedQueryParams, {
    enabled: shouldFetch,
    keepPreviousData: true,
  });

  const nearByStops: Stop[] =
    shouldFetch && data?.nearByStops ? data.nearByStops : NO_STOPS;

  return {
    isLoading: isFetching,
    nearByStops,
  };
};
