import * as React from "react";
import { useMemo } from "react";
import { VehiclePosition } from "shared/types/interface.d";

import { VehicleMarker } from "./VehicleMarker";

interface VehicleMarkersProps {
  vehiclePositions: VehiclePosition[];
  onClick: (vehiclePosition: VehiclePosition) => void;
}

export const VehicleMarkers: React.FC<VehicleMarkersProps> = ({
  vehiclePositions,
  onClick,
}) => {
  const vehicleMarkers = useMemo(
    () =>
      vehiclePositions.map((vehiclePosition) => (
        <VehicleMarker
          key={vehiclePosition?.vehicle?.id || ""}
          onClick={onClick}
          vehiclePosition={vehiclePosition}
        />
      )),
    [vehiclePositions]
  );

  return <>{vehicleMarkers}</>;
};
