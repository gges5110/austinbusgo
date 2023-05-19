import React from "react";
import { VehiclePosition } from "../../../interfaces/interface.d";
import { useStopQuery } from "../../../schemas/Stop.generated";
import { useTripQuery } from "../../../schemas/Trip.generated";
import { VehiclePopupContent } from "./VehiclePopupContent";

export interface VehiclePopupContainerProps {
  readonly vehiclePosition: VehiclePosition;
}

export const VehiclePopupContainer: React.FunctionComponent<VehiclePopupContainerProps> = ({
  vehiclePosition,
}) => {
  const { data: stop, isLoading: stopLoading } = useStopQuery({
    stopId: vehiclePosition.stopId || "",
  });

  const { data: trip, isLoading: tripLoading } = useTripQuery({
    tripId: vehiclePosition?.trip?.tripId || "",
  });

  return (
    <VehiclePopupContent
      stop={stop}
      stopLoading={stopLoading}
      trip={trip}
      tripLoading={tripLoading}
      vehiclePosition={vehiclePosition}
    />
  );
};
