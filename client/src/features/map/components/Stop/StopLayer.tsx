import { useAtomValue } from "jotai";
import * as React from "react";
import { FC, useEffect, useMemo } from "react";
import { Layer, Source, useMap } from "react-map-gl/mapbox";
import { hoveringStopAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

export const STOP_CIRCLES_LAYER_ID = "stop-circles";
export const STOP_LABELS_LAYER_ID = "stop-labels";

interface StopLayerProps {
  readonly darkMode?: boolean;
  readonly selectedStop: Stop | undefined;
  readonly stops: Stop[];
}

export const StopLayer: FC<StopLayerProps> = ({
  stops,
  selectedStop,
  darkMode = false,
}) => {
  const { mapId: map } = useMap();
  const hoveringStop = useAtomValue(hoveringStopAtom);
  const selectedStopId = selectedStop?.stopId ?? "";

  const stopsGeoJSON = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: stops
        .filter((stop) => stop.stopLoc?.coordinates != null)
        .map((stop) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: (stop.stopLoc?.coordinates ?? [0, 0]) as [
              number,
              number,
            ],
          },
          properties: {
            stopCode: stop.stopCode ?? "",
            stopId: stop.stopId,
            stopName: stop.stopName ?? "",
            // More routes = lower sort key number = placed first = wins collision
            priority: Math.max(1, 10 - (stop.routes?.length ?? 0)),
          },
        })),
    }),
    [stops]
  );

  // Sync hoveringStop atom with Mapbox feature state so sidebar hover
  // highlights the corresponding circle on the map.
  useEffect(() => {
    if (!map || !hoveringStop) return;
    if (!map.getSource("stops-source")) return;

    map.setFeatureState(
      { id: hoveringStop.stopId, source: "stops-source" },
      { hovered: true }
    );

    return () => {
      if (map.getSource("stops-source")) {
        map.setFeatureState(
          { id: hoveringStop.stopId, source: "stops-source" },
          { hovered: false }
        );
      }
    };
  }, [map, hoveringStop]);

  const textColor = darkMode ? "#e8eaed" : "#202124";
  const textHaloColor = darkMode ? "#1a1a1a" : "#ffffff";

  return (
    <Source
      data={stopsGeoJSON}
      id={"stops-source"}
      promoteId={"stopId"}
      type={"geojson"}
    >
      {/* Circle layer for stop pin dots — WebGL rendered, no DOM overhead */}
      <Layer
        id={STOP_CIRCLES_LAYER_ID}
        minzoom={11}
        paint={{
          "circle-color": [
            "case",
            ["==", ["get", "stopId"], selectedStopId],
            "#EA4335",
            ["boolean", ["feature-state", "hovered"], false],
            "#EA4335",
            "#1A73E8",
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            11,
            4,
            14,
            7,
            18,
            10,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        }}
        type={"circle"}
      />

      {/* Symbol layer for stop name labels — native collision detection and
          importance ranking via symbol-sort-key */}
      <Layer
        id={STOP_LABELS_LAYER_ID}
        layout={{
          "symbol-sort-key": ["get", "priority"],
          "text-allow-overlap": false,
          // Only show labels at zoom 14+; collision detection hides overlaps
          "text-field": ["step", ["zoom"], "", 14, ["get", "stopName"]],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.5],
          // Show the circle pin even when the label text collides
          "text-optional": true,
          "text-size": 12,
        }}
        minzoom={11}
        paint={{
          "text-color": textColor,
          "text-halo-color": textHaloColor,
          "text-halo-width": 1,
        }}
        type={"symbol"}
      />
    </Source>
  );
};
