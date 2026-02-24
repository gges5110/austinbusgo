import { useAtomValue } from "jotai";
import * as React from "react";
import { FC, useEffect, useMemo, useState } from "react";
import { Layer, Source, useMap } from "react-map-gl/mapbox";
import { hoveringStopAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

export const STOP_CIRCLES_LAYER_ID = "stop-circles";
export const STOP_LABELS_LAYER_ID = "stop-labels";

/**
 * Returns the cell size in degrees for the label grid at a given zoom level.
 * Halves with each zoom step so the number of visible grid cells stays roughly
 * constant as the user zooms in. Clamped to [0.005°, 1°].
 *   zoom 6  → ~1°    (~110 km)
 *   zoom 10 → ~0.06° (~7 km)
 *   zoom 14 → ~0.004° → clamped to 0.005° (~0.5 km)
 */
function labelGridCellDeg(zoom: number): number {
  return Math.min(1, Math.max(0.005, Math.pow(2, 6 - zoom)));
}

/**
 * Returns the set of stopIds that are the highest-priority stop in their
 * grid cell. Priority is determined by route count (more routes = wins).
 * Ties are broken by stopId for stable output.
 */
function buildLabelGridWinners(stops: Stop[], zoom: number): Set<string> {
  const cellDeg = labelGridCellDeg(zoom);
  const cellBest = new Map<string, { stopId: string; priority: number }>();

  for (const stop of stops) {
    const coords = stop.stopLoc?.coordinates;
    if (!coords) continue;
    const [lon, lat] = coords;
    const cellKey = `${Math.floor(lat / cellDeg)},${Math.floor(lon / cellDeg)}`;
    const priority = Math.max(1, 10 - (stop.routes?.length ?? 0));
    const existing = cellBest.get(cellKey);
    if (
      !existing ||
      priority < existing.priority ||
      (priority === existing.priority && stop.stopId < existing.stopId)
    ) {
      cellBest.set(cellKey, { stopId: stop.stopId, priority });
    }
  }

  return new Set([...cellBest.values()].map((b) => b.stopId));
}

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

  // Track integer zoom so the grid only recomputes on whole-zoom-level changes.
  const [zoom, setZoom] = useState<number>(() =>
    Math.floor(map?.getZoom() ?? 10)
  );
  useEffect(() => {
    if (!map) return;
    const onZoom = () => setZoom(Math.floor(map.getZoom()));
    map.on("zoom", onZoom);
    return () => {
      map.off("zoom", onZoom);
    };
  }, [map]);

  const stopsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const gridWinners = buildLabelGridWinners(stops, zoom);
    return {
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
            // 1 if this stop is the highest-priority in its label-grid cell;
            // used to show one representative stop per region at all zoom levels.
            gridRank: gridWinners.has(stop.stopId) ? 1 : 0,
          },
        })),
    };
  }, [stops, zoom]);

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
      {/* Circle layer for stop pin dots — WebGL rendered, no DOM overhead.
          Below zoom 16 only the label-grid winner per ~11 km cell is shown,
          ensuring geographic spread. At zoom 16+ all stops appear. */}
      <Layer
        id={STOP_CIRCLES_LAYER_ID}
        paint={{
          "circle-color": [
            "case",
            ["==", ["get", "stopId"], selectedStopId],
            "#EA4335",
            ["boolean", ["feature-state", "hovered"], false],
            "#EA4335",
            "#1A73E8",
          ],
          "circle-opacity": [
            "step",
            ["zoom"],
            ["case", ["==", ["get", "gridRank"], 1], 1, 0],
            16,
            1,
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            3,
            11,
            4,
            14,
            7,
            18,
            10,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": [
            "step",
            ["zoom"],
            ["case", ["==", ["get", "gridRank"], 1], 1, 0],
            16,
            1,
          ],
          "circle-stroke-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            1,
            11,
            2,
          ],
        }}
        type={"circle"}
      />

      {/* Symbol layer for stop name labels — native collision detection and
          importance ranking via symbol-sort-key */}
      <Layer
        filter={["step", ["zoom"], ["==", ["get", "gridRank"], 1], 16, true]}
        id={STOP_LABELS_LAYER_ID}
        layout={{
          "symbol-sort-key": ["get", "priority"],
          "text-allow-overlap": false,
          // Only show labels at zoom 14+; collision detection hides overlaps
          "text-field": ["step", ["zoom"], "", 10, ["get", "stopName"]],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.5],
          // Show the circle pin even when the label text collides
          "text-optional": true,
          "text-size": 12,
        }}
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
