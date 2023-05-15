import * as React from "react";
import { Marker } from "react-map-gl";
import { Stop } from "../../../interfaces/interface.d";
import { StopPin } from "./StopPin";

interface StopMarkerProps {
  readonly stop: Stop;
  readonly highlighted?: boolean;

  setSelectedStop(stop: Stop): void;
}

export class StopMarker extends React.PureComponent<StopMarkerProps> {
  public render(): React.ReactNode {
    const { stop } = this.props;
    return (
      <Marker
        longitude={stop.stopLoc?.coordinates?.[0] || 0}
        latitude={stop.stopLoc?.coordinates?.[1] || 0}
        key={stop.stopId}
      >
        <StopPin
          highlighted={this.props.highlighted}
          stopName={stop.stopName || ""}
          onClick={this.onClick}
        />
      </Marker>
    );
  }

  private onClick = (): void => {
    if (this.props.setSelectedStop) {
      this.props.setSelectedStop(this.props.stop);
    }
  };
}
