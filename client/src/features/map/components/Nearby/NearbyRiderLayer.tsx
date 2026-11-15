import { nearbyMapPadding } from "features/map/components/Nearby/NearbyFocusLayer";
import * as React from "react";
import { FC, useEffect, useMemo, useRef } from "react";
import { Layer, Source, useMap } from "react-map-gl/mapbox";

// Close enough to see the streets and stops around the rider
const RIDER_ZOOM = 15;

interface NearbyRiderLayerProps {
  /** Pan to the rider (when there's no stop to frame instead) */
  readonly pan: boolean;
  readonly rider: { latitude: number; longitude: number };
}

/**
 * The rider's location on the Nearby map: a "you are here" dot, and with
 * no stop nearby, the map centered on it so the rider sees where they are.
 */
export const NearbyRiderLayer: FC<NearbyRiderLayerProps> = ({ pan, rider }) => {
  const { current: map } = useMap();

  const data = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [rider.longitude, rider.latitude],
          },
          properties: {},
        },
      ],
    }),
    [rider]
  );

  // Pan once each time there's no stop to frame, not on every location
  // update, which would yank the map away from a rider panning it
  const panned = useRef(false);
  useEffect(() => {
    if (!pan) {
      panned.current = false;
      return;
    }
    if (!map || panned.current) return;
    panned.current = true;
    map.flyTo({
      center: [rider.longitude, rider.latitude],
      zoom: Math.max(map.getZoom(), RIDER_ZOOM),
      padding: nearbyMapPadding(),
      duration: 800,
    });
  }, [map, pan, rider]);

  return (
    <Source data={data} id={"nearby-rider"} type={"geojson"}>
      <Layer
        id={"nearby-rider-dot"}
        paint={{
          "circle-color": "#1a73e8",
          "circle-radius": 7,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
        }}
        slot={"top"}
        type={"circle"}
      />
    </Source>
  );
};
