import * as React from "react";
import { Marker } from "react-map-gl";
import { Stop } from "../../../interfaces/interface.d";
import { StopPin } from "./StopPin";
import { iconSize } from "../Map";

interface StopMarkerProps {
  readonly stop: Stop;
  readonly direction: boolean;
  fetchArrivalTime?(stop: Stop): void;
}

export class StopMarker extends React.PureComponent<StopMarkerProps> {
  public render(): React.ReactNode {
    const { stop } = this.props;
    return (
      <Marker
        longitude={stop.stopLon || 0}
        latitude={stop.stopLat || 0}
        key={stop.stopId}
        offsetLeft={-iconSize.width / 2}
        offsetTop={-iconSize.height}
      >
        <StopPin stopName={stop.stopName || ""} onClick={this.onClick} />
      </Marker>
    );
  }

  private onClick = (): void => {
    if (this.props.fetchArrivalTime) {
      this.props.fetchArrivalTime(this.props.stop);
    }
  };
}
