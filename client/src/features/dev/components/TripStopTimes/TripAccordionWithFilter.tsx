import React from "react";
import { useTripQuery } from "shared/api/schemas/Trip.generated";

import { TripAccordion } from "./TripAccordion";

interface TripAccordionWithFilterProps {
  tripId: string;
  routeColor: string;
  selectedDirection: number;
}

export const TripAccordionWithFilter: React.FC<
  TripAccordionWithFilterProps
> = ({ tripId, routeColor, selectedDirection }) => {
  const { data: tripData } = useTripQuery(
    { tripId },
    {
      enabled: !!tripId,
    }
  );

  // Only render if the trip matches the selected direction
  if (!tripData?.trip || tripData.trip.directionId !== selectedDirection) {
    return null;
  }

  return <TripAccordion routeColor={routeColor} tripId={tripId} />;
};
