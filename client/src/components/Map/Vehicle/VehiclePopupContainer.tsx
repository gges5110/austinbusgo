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
  const { data: stop, loading: stopLoading } = useStopQuery({
    variables: {
      stopId: vehiclePosition.stopId || "",
    },
  });

  const { data: trip, loading: tripLoading } = useTripQuery({
    variables: {
      tripId: vehiclePosition?.trip?.tripId || "",
    },
  });

  return (
    <VehiclePopupContent
      vehiclePosition={vehiclePosition}
      stop={stop}
      stopLoading={stopLoading}
      trip={trip}
      tripLoading={tripLoading}
    />
  );
};
