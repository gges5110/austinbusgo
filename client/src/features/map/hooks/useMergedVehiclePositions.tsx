import { useAllVehiclePositions } from "features/map/hooks/useAllVehiclePositions";
import { useVehiclePositions } from "features/map/hooks/useVehiclePositions";
import { useMemo } from "react";
import { VehiclePosition } from "shared/types/interface.d";

/**
 * Merges route-specific vehicle positions with the "all vehicles" feed,
 * deduplicating by vehicle id (route-specific wins).
 */
export const useMergedVehiclePositions = (): VehiclePosition[] => {
  const { vehiclePositions } = useVehiclePositions();
  const { allVehiclePositions } = useAllVehiclePositions();

  return useMemo(() => {
    const routeVehicleIds = new Set(
      vehiclePositions.map((v) => v.vehicle?.id).filter(Boolean)
    );
    return [
      ...vehiclePositions,
      ...allVehiclePositions.filter(
        (v) => !v.vehicle?.id || !routeVehicleIds.has(v.vehicle.id)
      ),
    ];
  }, [vehiclePositions, allVehiclePositions]);
};
