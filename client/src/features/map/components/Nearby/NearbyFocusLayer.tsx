import { uiMapPadding } from "features/map/utils/mapPadding";
import { NEARBY_RADIUS_METERS } from "features/nearby/hooks/useNearestStop";
import { distanceMeters } from "features/nearby/utils/geo";
import { trackPath } from "features/nearby/utils/mapData";
import * as React from "react";
import { FC, useEffect, useMemo, useRef } from "react";
import { Layer, Source, useMap } from "react-map-gl/mapbox";
import { NearbyFocus } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

const TRACK_SOURCE_ID = "nearby-track";

// Margin around the framed points, in pixels
const FRAME_MARGIN = 48;

// Keep the framed points clear of the panel (at its current size), the
// search bar where there is one (the stop page; not Nearby) and tab bar on
// phones, and the side panel on desktop
export const nearbyMapPadding = (searchBar = false) =>
  uiMapPadding({ margin: FRAME_MARGIN, searchBar });

interface NearbyFocusLayerProps {
  readonly focus: NearbyFocus;
  readonly stop?: Stop;
}

/**
 * Map extras for the Nearby screen (and a stop page's tapped bus): the selected bus's path to the stop,
 * and camera framing. The buses themselves are drawn by VehicleLayer.
 */
export const NearbyFocusLayer: FC<NearbyFocusLayerProps> = ({
  focus,
  stop,
}) => {
  const { current: map } = useMap();
  const selected = focus.arrivals.find(
    (arrival) => arrival.tripId === focus.selectedTripId
  );
  const routeColor = `#${selected?.routeColor || "1a73e8"}`;

  const trackGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const coordinates = selected ? trackPath(selected) : [];
    return {
      type: "FeatureCollection",
      features:
        coordinates.length > 1
          ? [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates },
                properties: {},
              },
            ]
          : [],
    };
  }, [selected]);

  // Frame the scene when the stop or the selection changes — not on every
  // 15s refresh, which would yank the map away from a rider panning it
  const framedKey = useRef<string>();
  useEffect(() => {
    if (!map || !stop?.stopLoc?.coordinates) return;
    const key = `${focus.stopId}|${focus.selectedTripId ?? ""}`;
    if (framedKey.current === key) return;

    const points: number[][] = [stop.stopLoc.coordinates];
    if (selected) {
      points.push(...trackPath(selected));
    } else {
      const [longitude, latitude] = stop.stopLoc.coordinates;
      // A rider still walking to the stop needs the way there; the bus can
      // be miles off and would zoom the map out past the streets and stops
      const walking =
        !!focus.rider &&
        distanceMeters(focus.rider, { latitude, longitude }) >
          NEARBY_RADIUS_METERS;
      if (focus.rider) {
        points.push([focus.rider.longitude, focus.rider.latitude]);
      }
      const nearestLiveBus = focus.arrivals.find((arrival) => arrival.vehicle);
      if (nearestLiveBus?.vehicle && !walking) {
        points.push([nearestLiveBus.vehicle.lon, nearestLiveBus.vehicle.lat]);
      }
    }
    framedKey.current = key;

    const lons = points.map(([lon]) => lon);
    const lats = points.map(([, lat]) => lat);
    map.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { maxZoom: 16, padding: nearbyMapPadding(focus.searchBar), duration: 800 }
    );
  }, [map, stop, focus, selected]);

  return (
    <Source data={trackGeoJSON} id={TRACK_SOURCE_ID} type={"geojson"}>
      <Layer
        id={"nearby-track-line"}
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": routeColor,
          "line-dasharray": [1, 1.5],
          "line-width": 5,
        }}
        slot={"middle"}
        type={"line"}
      />
    </Source>
  );
};
