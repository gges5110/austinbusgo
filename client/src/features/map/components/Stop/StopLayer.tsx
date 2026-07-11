import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MapHoverPopup } from "features/map/components/MapHoverPopup";
import { useFeatureHoverState } from "features/map/hooks/useFeatureHoverState";
import { useHoverClose } from "features/map/hooks/useHoverClose";
import {
  LayerMouseEvent,
  useLayerEvents,
} from "features/map/hooks/useLayerEvents";
import { GeneratedImage, useMapImage } from "features/map/hooks/useMapImage";
import { toPointFeatureCollection } from "features/map/utils/geojson";
import { useAtom, useSetAtom } from "jotai";
import * as React from "react";
import { FC, useCallback, useMemo } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { useCurrentStop } from "shared/hooks/UseCurrentStop";
import {
  hoveringStopAtom,
  hoveringVehiclePositionAtom,
  pinnedVehiclePositionAtom,
} from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

import { StopPeekSheet } from "./StopPeekSheet";
import { StopPopupContent } from "./StopPopupContent";

export const STOPS_LAYER_ID = "stops";
const STOP_LAYER_IDS = [STOPS_LAYER_ID];
const STOPS_SOURCE_ID = "stops-source";
const STOP_DOT_IMAGE_ID = "stop-dot";

/**
 * SDF sprite for the stop dot. Icons (unlike circle layers) participate in
 * Mapbox's native collision engine, which is what declutters the ~2,300
 * stops at low zoom. Encoding the circle as a signed distance field lets
 * the style recolor it per-feature (icon-color supports feature-state,
 * which layout-time icon switching does not) and draw the white ring via
 * icon-halo-*.
 */
const DOT_SPRITE_SIZE = 64;
const DOT_SPRITE_RADIUS = 20;
const DOT_SDF_SPREAD = 8;

function createStopDotImage(): GeneratedImage {
  const size = DOT_SPRITE_SIZE;
  const data = new Uint8ClampedArray(size * size * 4);
  const center = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const distance =
        Math.hypot(x - center + 0.5, y - center + 0.5) - DOT_SPRITE_RADIUS;
      // Mapbox's SDF shader draws the shape where alpha ≈ 0.75+; the
      // falloff below that leaves room for the halo ring
      const alpha = Math.max(0, Math.min(1, 0.75 - distance / DOT_SDF_SPREAD));
      data[(y * size + x) * 4 + 3] = Math.round(alpha * 255);
    }
  }
  return { width: size, height: size, data };
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

  useMapImage(STOP_DOT_IMAGE_ID, createStopDotImage, true);

  const stopsById = useMemo(() => {
    const m = new Map<string, Stop>();
    for (const stop of stops) {
      m.set(stop.stopId, stop);
    }
    return m;
  }, [stops]);

  const stopsGeoJSON = useMemo(
    () =>
      toPointFeatureCollection(
        stops,
        (stop) => stop.stopLoc?.coordinates,
        (stop) => ({
          stopCode: stop.stopCode ?? "",
          stopId: stop.stopId,
          stopName: stop.stopName ?? "",
          // More routes = lower sort key number = placed first = wins
          // collision against less-connected stops
          priority: Math.max(1, 10 - (stop.routes?.length ?? 0)),
        })
      ),
    [stops]
  );

  // Sync hoveringStop atom with Mapbox feature state so sidebar hover
  // highlights the corresponding dot on the map.
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
      {/* Single symbol layer for dots + labels. The native collision engine
          declutters both: dots thin out at low zoom (icon-padding widens the
          collision box), and labels drop before dots do (text-optional).
          On route pages (disableLod) every stop must stay visible, so icons
          are allowed to overlap. */}
      <Layer
        id={STOPS_LAYER_ID}
        layout={{
          "icon-allow-overlap": disableLod,
          "icon-image": STOP_DOT_IMAGE_ID,
          // Wider collision box at low zoom = fewer, better-spaced dots
          "icon-padding": ["interpolate", ["linear"], ["zoom"], 8, 10, 13, 2],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            0.15,
            11,
            0.2,
            14,
            0.35,
            18,
            0.5,
          ],
          "symbol-sort-key": ["get", "priority"],
          // Labels only at zoom 10+; collision then hides overlaps
          "text-field": ["step", ["zoom"], "", 10, ["get", "stopName"]],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          // Drop the label under collision pressure but keep the dot
          "text-optional": true,
          "text-radial-offset": 0.8,
          "text-size": 12,
          // Let labels slide to whichever side fits — places more labels
          // in dense areas than a fixed anchor
          "text-variable-anchor": ["right", "left", "top", "bottom"],
        }}
        paint={{
          "icon-color": [
            "case",
            ["==", ["get", "stopId"], selectedStopId],
            "#EA4335",
            ["boolean", ["feature-state", "hovered"], false],
            "#EA4335",
            "#1A73E8",
          ],
          "icon-halo-color": "#ffffff",
          "icon-halo-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            0.5,
            11,
            1,
          ],
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
