import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MapHoverPopup } from "features/map/components/MapHoverPopup";
import { useFeatureHoverState } from "features/map/hooks/useFeatureHoverState";
import { useHoverClose } from "features/map/hooks/useHoverClose";
import {
  LayerMouseEvent,
  useLayerEvents,
} from "features/map/hooks/useLayerEvents";
import { toPointFeatureCollection } from "features/map/utils/geojson";
import { useAtom, useSetAtom } from "jotai";
import * as React from "react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Layer, Source, useMap } from "react-map-gl/mapbox";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import {
  hoveringStopAtom,
  hoveringVehiclePositionAtom,
  pinnedVehiclePositionAtom,
} from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

import { StopPeekSheet } from "./StopPeekSheet";
import { StopPopupContent } from "./StopPopupContent";

export const STOP_CIRCLES_LAYER_ID = "stop-circles";
export const STOP_LABELS_LAYER_ID = "stop-labels";
const STOP_LAYER_IDS = [STOP_CIRCLES_LAYER_ID, STOP_LABELS_LAYER_ID];
const STOPS_SOURCE_ID = "stops-source";

/**
 * Returns the cell size in degrees for the label grid at a given zoom level.
 * Halves with each zoom step so the number of visible grid cells stays roughly
 * constant as the user zooms in. Clamped to [0.005°, 1°].
 *   zoom 6  → ~0.25° (~28 km)
 *   zoom 10 → ~0.015° (~1.7 km)
 *   zoom 14 → ~0.001° → clamped to 0.005° (~0.5 km)
 */
function labelGridCellDeg(zoom: number): number {
  return Math.min(1, Math.max(0.005, Math.pow(2, 4 - zoom)));
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [hoveringStop, setHoveringStop] = useAtom(hoveringStopAtom);
  const setHoveringVehicle = useSetAtom(hoveringVehiclePositionAtom);
  const setPinnedVehicle = useSetAtom(pinnedVehiclePositionAtom);
  const { setStop: setSelectedStop } = useCurrentStop();
  const selectedStopId = selectedStop?.stopId ?? "";

  const closeHoverPopup = useCallback(
    () => setHoveringStop(undefined),
    [setHoveringStop]
  );
  const { scheduleClose, cancelClose } = useHoverClose(closeHoverPopup);

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

  const stopsGeoJSON = useMemo(() => {
    const gridWinners = buildLabelGridWinners(stops, zoom);
    return toPointFeatureCollection(
      stops,
      (stop) => stop.stopLoc?.coordinates,
      (stop) => ({
        stopCode: stop.stopCode ?? "",
        stopId: stop.stopId,
        stopName: stop.stopName ?? "",
        // More routes = lower sort key number = placed first = wins collision
        priority: Math.max(1, 10 - (stop.routes?.length ?? 0)),
        // 1 if this stop is the highest-priority in its label-grid cell;
        // used to show one representative stop per region at all zoom levels.
        gridRank: gridWinners.has(stop.stopId) ? 1 : 0,
      })
    );
  }, [stops, zoom]);

  // Sync hoveringStop atom with Mapbox feature state so sidebar hover
  // highlights the corresponding circle on the map.
  useFeatureHoverState(STOPS_SOURCE_ID, hoveringStop?.stopId);

  const handleMouseEnter = useCallback(
    (e: LayerMouseEvent) => {
      cancelClose();
      setHoveringVehicle(undefined);
      setPinnedVehicle(undefined);
      const stopId = e.features?.[0]?.properties?.stopId as string | undefined;
      if (stopId && stopsById.has(stopId)) {
        setHoveringStop(stopsById.get(stopId));
      }
    },
    [
      cancelClose,
      setHoveringVehicle,
      setPinnedVehicle,
      stopsById,
      setHoveringStop,
    ]
  );

  const handleClick = useCallback(
    (e: LayerMouseEvent) => {
      const stopId = e.features?.[0]?.properties?.stopId as string | undefined;
      const stop = stopId ? stopsById.get(stopId) : undefined;
      if (!stop) return;
      if (isMobile) {
        // Mobile: tap shows the peek sheet instead of navigating away
        setHoveringStop(stop);
      } else {
        setSelectedStop(stop);
      }
    },
    [isMobile, stopsById, setHoveringStop, setSelectedStop]
  );

  useLayerEvents(STOP_LAYER_IDS, {
    onClick: handleClick,
    onMouseEnter: isMobile ? undefined : handleMouseEnter,
    onMouseLeave: isMobile ? undefined : scheduleClose,
  });

  const popupCoords = hoveringStop?.stopLoc?.coordinates;

  const textColor = darkMode ? "#e8eaed" : "#202124";
  const textHaloColor = darkMode ? "#1a1a1a" : "#ffffff";

  return (
    <Source
      data={stopsGeoJSON}
      id={STOPS_SOURCE_ID}
      promoteId={"stopId"}
      type={"geojson"}
    >
      {/* Circle layer for stop pin dots — WebGL rendered, no DOM overhead.
          Below zoom 13 only the label-grid winner per cell is shown,
          ensuring geographic spread. At zoom 13+ all stops appear. */}
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
                13,
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
                13,
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
        {...(!disableLod && {
          filter: ["step", ["zoom"], ["==", ["get", "gridRank"], 1], 13, true],
        })}
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
      {/* Mobile: peek sheet on tap */}
      {isMobile && hoveringStop && (
        <StopPeekSheet
          onClose={closeHoverPopup}
          open={true}
          stop={hoveringStop}
        />
      )}
      {/* Desktop: hover popup anchored to the map */}
      {!isMobile && hoveringStop && popupCoords && (
        <MapHoverPopup
          latitude={popupCoords[1]}
          longitude={popupCoords[0]}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <StopPopupContent stop={hoveringStop} />
        </MapHoverPopup>
      )}
    </Source>
  );
};
