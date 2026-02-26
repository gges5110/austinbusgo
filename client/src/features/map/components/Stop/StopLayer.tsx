import { useAtom, useSetAtom } from "jotai";
import * as React from "react";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Popup, Source, useMap } from "react-map-gl/mapbox";
import {
  hoveringStopAtom,
  hoveringVehiclePositionAtom,
  pinnedVehiclePositionAtom,
} from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

import { StopPopupContent } from "./StopPopupContent";

// mapboxgl.MapLayerMouseEvent is deprecated in mapbox-gl v3; use this alias
type LayerMouseEvent = mapboxgl.MapMouseEvent & {
  features?: mapboxgl.GeoJSONFeature[];
};

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
  readonly disableLod?: boolean;
  readonly selectedStop: Stop | undefined;
  readonly stops: Stop[];
}

export const StopLayer: FC<StopLayerProps> = ({
  stops,
  selectedStop,
  darkMode = false,
  disableLod = false,
}) => {
  const { mapId: map } = useMap();
  const [hoveringStop, setHoveringStop] = useAtom(hoveringStopAtom);
  const setHoveringVehicle = useSetAtom(hoveringVehiclePositionAtom);
  const setPinnedVehicle = useSetAtom(pinnedVehiclePositionAtom);
  const selectedStopId = selectedStop?.stopId ?? "";

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHoverClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setHoveringStop(undefined);
    }, 200);
  }, [setHoveringStop]);

  const cancelHoverClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const stopsById = useMemo(() => {
    const m = new Map<string, Stop>();
    for (const stop of stops) {
      m.set(stop.stopId, stop);
    }
    return m;
  }, [stops]);

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

  const handleStopMouseEnter = useCallback(
    (e: LayerMouseEvent) => {
      cancelHoverClose();
      setHoveringVehicle(undefined);
      setPinnedVehicle(undefined);
      const stopId = e.features?.[0]?.properties?.stopId as string | undefined;
      if (stopId && stopsById.has(stopId)) {
        setHoveringStop(stopsById.get(stopId));
      }
    },
    [
      cancelHoverClose,
      setHoveringVehicle,
      setPinnedVehicle,
      stopsById,
      setHoveringStop,
    ]
  );

  const handleStopMouseLeave = useCallback(() => {
    scheduleHoverClose();
  }, [scheduleHoverClose]);

  useEffect(() => {
    if (!map) return;
    map.on("mouseenter", STOP_CIRCLES_LAYER_ID, handleStopMouseEnter);
    map.on("mouseleave", STOP_CIRCLES_LAYER_ID, handleStopMouseLeave);
    map.on("mouseenter", STOP_LABELS_LAYER_ID, handleStopMouseEnter);
    map.on("mouseleave", STOP_LABELS_LAYER_ID, handleStopMouseLeave);
    return () => {
      map.off("mouseenter", STOP_CIRCLES_LAYER_ID, handleStopMouseEnter);
      map.off("mouseleave", STOP_CIRCLES_LAYER_ID, handleStopMouseLeave);
      map.off("mouseenter", STOP_LABELS_LAYER_ID, handleStopMouseEnter);
      map.off("mouseleave", STOP_LABELS_LAYER_ID, handleStopMouseLeave);
    };
  }, [map, handleStopMouseEnter, handleStopMouseLeave]);

  const popupCoords = hoveringStop?.stopLoc?.coordinates;

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
          "circle-opacity": disableLod
            ? 1
            : [
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
          "circle-stroke-opacity": disableLod
            ? 1
            : [
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
        filter={
          disableLod
            ? true
            : ["step", ["zoom"], ["==", ["get", "gridRank"], 1], 16, true]
        }
        id={STOP_LABELS_LAYER_ID}
        layout={{
          "symbol-sort-key": ["get", "priority"],
          "text-allow-overlap": false,
          "text-anchor": "right",
          // Only show labels at zoom 14+; collision detection hides overlaps
          "text-field": ["step", ["zoom"], "", 10, ["get", "stopName"]],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [-1, 0],
          // Show the circle pin even when the label text collides
          "text-optional": true,
          "text-size": 12,
        }}
        paint={{
          "text-color": textColor,
          "text-halo-color": textHaloColor,
          "text-halo-width": 1,
          "text-opacity": [
            "case",
            ["==", ["get", "stopId"], selectedStopId],
            0.9,
            ["boolean", ["feature-state", "hovered"], false],
            0.9,
            1,
          ],
        }}
        type={"symbol"}
      />
      {/* Popup: shown on hover; mouse can pan into popup to keep it open */}
      {hoveringStop && popupCoords && (
        <Popup
          closeButton={false}
          closeOnClick={false}
          latitude={popupCoords[1]}
          longitude={popupCoords[0]}
          maxWidth={"none"}
          offset={14}
        >
          <div
            onMouseEnter={cancelHoverClose}
            onMouseLeave={scheduleHoverClose}
          >
            <StopPopupContent stop={hoveringStop} />
          </div>
        </Popup>
      )}
    </Source>
  );
};
