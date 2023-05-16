import { VehiclePosition } from "../../../interfaces/interface.d";
import * as React from "react";
import { useMemo } from "react";
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
          vehiclePosition={vehiclePosition}
          onClick={onClick}
        />
      )),
    [vehiclePositions]
  );

  return <>{vehicleMarkers}</>;
};
