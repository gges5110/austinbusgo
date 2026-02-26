import * as React from "react";
import { Stop } from "shared/types/interface.d";

import { StopLayer } from "./StopLayer";

interface StopMarkersProps {
  readonly darkMode?: boolean;
  readonly disableLod?: boolean;
  readonly selectedStop: Stop | undefined;
  readonly stops: Stop[];
}

export const StopMarkers: React.FC<StopMarkersProps> = ({
  stops,
  selectedStop,
  darkMode,
  disableLod,
}) => {
  return (
    <StopLayer
      darkMode={darkMode}
      disableLod={disableLod}
      selectedStop={selectedStop}
      stops={stops}
    />
  );
};
