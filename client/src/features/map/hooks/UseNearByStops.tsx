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

  const lat = viewState ? parseFloat(viewState.latitude.toFixed(precision)) : 0;
  const lon = viewState
    ? parseFloat(viewState.longitude.toFixed(precision))
    : 0;

  const radius = viewState
    ? Math.min(20000, Math.round(5000 * Math.pow(2, 14 - viewState.zoom)))
    : 1000;

  const limit = viewState
    ? viewState.zoom <= 11
      ? 20
      : viewState.zoom <= 14
        ? 40
        : 60
    : 20;

  // Get current map bounds for more precise filtering
  const bounds = map?.getBounds();
  const minLat = bounds?.getSouth();
  const minLon = bounds?.getWest();
  const maxLat = bounds?.getNorth();
  const maxLon = bounds?.getEast();

  const { data, isFetching } = useNearByStopsQuery(
    { lat, lon, radius, limit, minLat, minLon, maxLat, maxLon },
    {
      enabled: shouldFetch,
      keepPreviousData: true,
    }
  );

  const isLoading = isFetching;

  const nearByStops: Stop[] = shouldFetch ? (data?.nearByStops ?? []) : [];

  return {
    isLoading,
    nearByStops,
  };
};
