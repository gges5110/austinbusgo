import { useQuery } from "@tanstack/react-query";
import {
  fetchTripUpdates,
  fetchVehiclePositions,
} from "shared/services/gtfsRtFrontend";

const REFETCH_INTERVAL_MS = 15_000;

export const GTFS_RT_VEHICLE_POSITIONS_KEY = "gtfs-rt-vehicle-positions";
export const GTFS_RT_TRIP_UPDATES_KEY = "gtfs-rt-trip-updates";

/**
 * Fetches all CapMetro vehicle positions directly from the GTFS-RT feed,
 * without going through the backend server.
 */
export function useGtfsRtVehiclePositions() {
  return useQuery({
    queryKey: [GTFS_RT_VEHICLE_POSITIONS_KEY],
    queryFn: fetchVehiclePositions,
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

/**
 * Fetches CapMetro trip updates directly from the GTFS-RT feed,
 * without going through the backend server.
 *
 * Optionally filter by routeId or tripId to mirror the existing backend API.
 */
export function useGtfsRtTripUpdates(filter?: {
  routeId?: string;
  tripId?: string;
}) {
  return useQuery({
    queryKey: [GTFS_RT_TRIP_UPDATES_KEY, filter],
    queryFn: () => fetchTripUpdates(filter?.routeId, filter?.tripId),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}
