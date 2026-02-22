import * as React from "react";
import { Stop } from "shared/types/interface.d";

import { StopLayer } from "./StopLayer";

interface StopMarkersProps {
  readonly selectedStop: Stop | undefined;
  readonly stops: Stop[];
}

export const StopMarkers: React.FC<StopMarkersProps> = ({
  stops,
  selectedStop,
}) => {
  return <StopLayer selectedStop={selectedStop} stops={stops} />;
};
