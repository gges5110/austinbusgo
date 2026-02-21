import { ViewState } from "features/map/components/Map";
import { useNearByStopsQuery } from "shared/api/schemas/NearByStops.generated";
import { Stop } from "shared/types/interface.d";

export const stopsZoomThreshold = 12;

export const useNearByStops = (viewState?: ViewState) => {
  const shouldFetch =
    viewState !== undefined && viewState.zoom >= stopsZoomThreshold;

  // Round to 3 decimal places (~111m) to reduce redundant fetches while panning
  const lat = viewState ? parseFloat(viewState.latitude.toFixed(3)) : 0;
  const lon = viewState ? parseFloat(viewState.longitude.toFixed(3)) : 0;

  const { data, isFetching } = useNearByStopsQuery(
    { lat, lon },
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
