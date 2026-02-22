import { useDebounce } from "shared/hooks/useDebounce";
import { ViewState } from "features/map/components/Map";
import { useNearByStopsQuery } from "shared/api/schemas/NearByStops.generated";
import { Stop } from "shared/types/interface.d";
import { useMap } from "react-map-gl/mapbox";

export const useNearByStops = (viewState?: ViewState) => {
  const { mapId: map } = useMap();
  const shouldFetch = viewState !== undefined;

  // Rounding precision based on zoom level to prevent search area from "jumping" too far
  const precision = viewState
    ? viewState.zoom < 12
      ? 3
      : viewState.zoom < 16
        ? 4
        : 5
    : 3;

  const factor = Math.pow(10, precision);
  const lat = viewState ? Math.round(viewState.latitude * factor) / factor : 0;
  const lon = viewState ? Math.round(viewState.longitude * factor) / factor : 0;

  const radius = viewState
    ? Math.min(20000, Math.round(5000 * Math.pow(2, 14 - viewState.zoom)))
    : 1000;

  const limit = viewState
    ? viewState.zoom <= 11
      ? 40
      : viewState.zoom <= 14
        ? 80
        : 100
    : 40;

  // Get current map bounds for more precise filtering
  const bounds = map?.getBounds();
  const minLat = bounds?.getSouth();
  const minLon = bounds?.getWest();
  const maxLat = bounds?.getNorth();
  const maxLon = bounds?.getEast();

  const debouncedQueryParams = useDebounce(
    { lat, lon, radius, limit, minLat, minLon, maxLat, maxLon },
    500
  );

  const { data, isFetching } = useNearByStopsQuery(debouncedQueryParams, {
    enabled: shouldFetch,
    keepPreviousData: true,
  });

  const isLoading = isFetching;

  const nearByStops: Stop[] = shouldFetch ? (data?.nearByStops ?? []) : [];

  return {
    isLoading,
    nearByStops,
  };
};
