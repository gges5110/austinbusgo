import { useAtomValue } from "jotai";
import { useGtfsRtVehiclePositions } from "shared/hooks/useGtfsRtFrontend";
import { useShowAllVehicles } from "shared/hooks/UseShowAllVehicles";
import { isAutoPollingAtom } from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

const NO_VEHICLES: VehiclePosition[] = [];

/**
 * All active vehicles, fetched directly from the GTFS-RT feed via the
 * gtfs-rt-proxy worker — no backend round-trip (the backend's slowest
 * queries were the real-time ones, dominated by this same upstream call).
 */
export const useAllVehiclePositions = () => {
  const [showAllVehicles] = useShowAllVehicles();
  const autoPolling = useAtomValue(isAutoPollingAtom);

  const { data } = useGtfsRtVehiclePositions({
    enabled: showAllVehicles,
    refetchInterval: autoPolling ? 15000 : false,
  });

  const allVehiclePositions = showAllVehicles && data ? data : NO_VEHICLES;

  return { allVehiclePositions };
};
