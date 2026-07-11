import { useQuery } from "@tanstack/react-query";
import {
  fetchTripUpdates,
  fetchVehiclePositions,
} from "shared/services/gtfsRtFrontend";

const REFETCH_INTERVAL_MS = 15_000;

export const GTFS_RT_VEHICLE_POSITIONS_KEY = "gtfs-rt-vehicle-positions";
export const GTFS_RT_TRIP_UPDATES_KEY = "gtfs-rt-trip-updates";

interface GtfsRtQueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

/**
 * Fetches all CapMetro vehicle positions directly from the GTFS-RT feed,
 * without going through the backend server.
 */
export function useGtfsRtVehiclePositions(options: GtfsRtQueryOptions = {}) {
  return useQuery({
    queryKey: [GTFS_RT_VEHICLE_POSITIONS_KEY],
    queryFn: fetchVehiclePositions,
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: 1,
    ...options,
  });
}

/**
 * Fetches all CapMetro trip updates directly from the GTFS-RT feed, without
 * going through the backend server.
 *
 * The full feed is fetched once and shared; filter the returned array
 * client-side so changing a filter doesn't refetch the whole feed.
 */
export function useGtfsRtTripUpdates() {
  return useQuery({
    queryKey: [GTFS_RT_TRIP_UPDATES_KEY],
    queryFn: () => fetchTripUpdates(),
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: 1,
  });
}
