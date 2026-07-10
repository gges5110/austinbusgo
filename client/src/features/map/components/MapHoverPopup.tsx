import * as React from "react";
import { Popup } from "react-map-gl/mapbox";

interface MapHoverPopupProps {
  readonly children: React.ReactNode;
  readonly latitude: number;
  readonly longitude: number;
  readonly offset?: number;
  /** Cancel the pending close when the mouse moves onto the popup */
  readonly onMouseEnter: () => void;
  /** Re-schedule the close when the mouse leaves the popup */
  readonly onMouseLeave: () => void;
}

/**
 * Desktop hover popup anchored to the map. Pairs with useHoverClose: hovering
 * the popup keeps it open while the mouse travels from the feature into it.
 */
export const MapHoverPopup: React.FC<MapHoverPopupProps> = ({
  children,
  latitude,
  longitude,
  offset = 14,
  onMouseEnter,
  onMouseLeave,
}) => (
  <Popup
    closeButton={false}
    closeOnClick={false}
    latitude={latitude}
    longitude={longitude}
    maxWidth={"none"}
    offset={offset}
  >
    <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {children}
    </div>
  </Popup>
);
