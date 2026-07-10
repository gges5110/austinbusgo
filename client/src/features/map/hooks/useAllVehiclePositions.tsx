import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useRealTimeVehiclePositionsQuery } from "shared/api/schemas/RealTimeVehiclePositions.generated";
import { useShowAllVehicles } from "shared/hooks/UseShowAllVehicles";
import { isAutoPollingAtom } from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

const NO_VEHICLES: VehiclePosition[] = [];

export const useAllVehiclePositions = () => {
  const [showAllVehicles] = useShowAllVehicles();
  const autoPolling = useAtomValue(isAutoPollingAtom);

  const { data } = useRealTimeVehiclePositionsQuery(undefined, {
    enabled: showAllVehicles,
    refetchInterval: autoPolling ? 15000 : false,
  });

  const allVehiclePositions = useMemo(
    () =>
      showAllVehicles && data?.realTimeVehiclePositions
        ? data.realTimeVehiclePositions.filter(
            (v): v is VehiclePosition => v !== null
          )
        : NO_VEHICLES,
    [showAllVehicles, data]
  );

  return { allVehiclePositions };
};
