import { default as React, useMemo } from "react";
import { Stop } from "../../../../../shared/types/interface.d";
import { StopMarker } from "./StopMarker";

interface StopMarkersProps {
  readonly stops: Stop[];
  readonly selectedStop: Stop | undefined;

  setSelectedStop(stop: Stop): void;
}

export const StopMarkers: React.FC<StopMarkersProps> = ({
  stops,
  setSelectedStop,
  selectedStop,
}) => {
  const stopMarkers = useMemo(
    () =>
      stops.map((stop) => (
        <StopMarker
          highlighted={selectedStop?.stopId === stop.stopId}
          key={stop.stopId}
          setSelectedStop={setSelectedStop}
          stop={stop}
        />
      )),
    [stops, stop]
  );

  return <>{stopMarkers}</>;
};
