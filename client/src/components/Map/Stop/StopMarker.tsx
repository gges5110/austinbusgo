import * as React from "react";
import { Marker } from "react-map-gl";
import { Stop } from "../../../interfaces/interface.d";
import { StopPin } from "./StopPin";
import { useAtomValue } from "jotai";
import { hoveringStopAtom } from "../../../Atoms";

interface StopMarkerProps {
  readonly stop: Stop;
  readonly highlighted?: boolean;

  setSelectedStop(stop: Stop): void;
}

export const StopMarker: React.FC<StopMarkerProps> = ({
  stop,
  highlighted,
  setSelectedStop,
}) => {
  const hoveringStop = useAtomValue(hoveringStopAtom);

  return (
    <Marker
      key={stop.stopId}
      latitude={stop.stopLoc?.coordinates?.[1] || 0}
      longitude={stop.stopLoc?.coordinates?.[0] || 0}
    >
      <StopPin
        highlighted={highlighted || hoveringStop?.stopId === stop.stopId}
        onClick={() => {
          setSelectedStop(stop);
        }}
        stopName={stop.stopName || ""}
      />
    </Marker>
  );
};
