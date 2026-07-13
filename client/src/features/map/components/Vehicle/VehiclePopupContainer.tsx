import React from "react";
import { useStop, useTrip } from "shared/api/generated/api";
import { VehiclePosition } from "shared/types/interface.d";

import { VehiclePopupContent } from "./VehiclePopupContent";

export interface VehiclePopupContainerProps {
  readonly vehiclePosition: VehiclePosition;
}

export const VehiclePopupContainer: React.FunctionComponent<
  VehiclePopupContainerProps
> = ({ vehiclePosition }) => {
  const { data: stop, isLoading: stopLoading } = useStop(
    vehiclePosition.stopId || ""
  );

  const { data: trip, isLoading: tripLoading } = useTrip(
    vehiclePosition?.trip?.tripId || ""
  );

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
