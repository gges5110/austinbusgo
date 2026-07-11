import { useAllStopsQuery } from "shared/api/schemas/AllStops.generated";
import { Stop } from "shared/types/interface.d";

// Matches the edge cache TTL for static GTFS data; within a session the
// data can't change, so there's no point refetching on window focus
const STALE_TIME_MS = 6 * 60 * 60 * 1000;

// Stable empty array so consumers' memos don't recompute on every render
const NO_STOPS: Stop[] = [];

/**
 * Every stop in the system (~2,300, ~72KB gzipped), fetched once per
 * session. The constant query key makes the response an edge-cache hit for
 * every visitor, and panning/zooming needs no further network — Mapbox GL
 * culls offscreen points and StopLayer's LOD handles density.
 */
export const useAllStops = (enabled: boolean) => {
  const { data, isFetching } = useAllStopsQuery(undefined, {
    enabled,
    staleTime: STALE_TIME_MS,
  });

  const allStops: Stop[] = enabled && data ? (data.stops as Stop[]) : NO_STOPS;

  return {
    isLoading: isFetching,
    allStops,
  };
};
