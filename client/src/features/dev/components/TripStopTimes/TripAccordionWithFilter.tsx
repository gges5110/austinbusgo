import React from "react";
import { useTrip } from "shared/api/generated/api";

import { TripAccordion } from "./TripAccordion";

interface TripAccordionWithFilterProps {
  tripId: string;
  routeColor: string;
  selectedDirection: number;
}

export const TripAccordionWithFilter: React.FC<
  TripAccordionWithFilterProps
> = ({ tripId, routeColor, selectedDirection }) => {
  const { data: tripData } = useTrip(tripId, {
    query: { enabled: !!tripId },
  });

  // Only render if the trip matches the selected direction
  if (!tripData || tripData.directionId !== selectedDirection) {
    return null;
  }

  return <TripAccordion routeColor={routeColor} tripId={tripId} />;
};
