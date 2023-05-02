import { PureComponent, default as React } from "react";
import { Stop } from "../../../interfaces/interface.d";
import { StopMarker } from "./StopMarker";

interface StopMarkersProps {
  readonly stops: Stop[];
  readonly selectedStop: Stop | undefined;

  setSelectedStop(stop: Stop): void;
}

export class StopMarkers extends PureComponent<StopMarkersProps> {
  public render() {
    const { stops, setSelectedStop, selectedStop } = this.props;
    return stops.map((stop) => (
      <StopMarker
        key={stop.stopId}
        stop={stop}
        setSelectedStop={setSelectedStop}
        highlighted={selectedStop?.stopId === stop.stopId}
      />
    ));
  }
}
