import { PureComponent, default as React } from "react";
import { Stop } from "../../../interfaces/interface.d";
import { StopMarker } from "./StopMarker";

interface StopMarkersProps {
  readonly stops: Stop[];
  readonly direction: boolean;
  setSelectedStop(stop: Stop): void;
}

export class StopMarkers extends PureComponent<StopMarkersProps> {
  public render(): React.ReactNode {
    const { stops, direction, setSelectedStop } = this.props;
    return stops.map((stop) => (
      <StopMarker
        key={stop.stopId}
        direction={direction}
        stop={stop}
        fetchArrivalTime={setSelectedStop}
      />
    ));
  }
}
