import { useAtomValue } from "jotai";
import { useRealTimeVehiclePositionsQuery } from "shared/api/schemas/RealTimeVehiclePositions.generated";
import { useShowAllVehicles } from "shared/hooks/UseShowAllVehicles";
import { isAutoPollingAtom } from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

export const useAllVehiclePositions = () => {
  const [showAllVehicles] = useShowAllVehicles();
  const autoPolling = useAtomValue(isAutoPollingAtom);

  const { data } = useRealTimeVehiclePositionsQuery(undefined, {
    enabled: showAllVehicles,
    refetchInterval: autoPolling ? 15000 : false,
  });

  if (!showAllVehicles) {
    return { allVehiclePositions: [] };
  }

  const allVehiclePositions: VehiclePosition[] = (
    data?.realTimeVehiclePositions ?? []
  ).filter((v): v is VehiclePosition => v !== null);

  return { allVehiclePositions };
};
