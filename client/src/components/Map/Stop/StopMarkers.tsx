import { default as React, useMemo } from "react";
import { Stop } from "../../../interfaces/interface.d";
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
          key={stop.stopId}
          stop={stop}
          setSelectedStop={setSelectedStop}
          highlighted={selectedStop?.stopId === stop.stopId}
        />
      )),
    [stops, stop]
  );

  return <>{stopMarkers}</>;
};
