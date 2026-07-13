import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MapHoverPopup } from "features/map/components/MapHoverPopup";
import { useFeatureHoverState } from "features/map/hooks/useFeatureHoverState";
import { useHoverClose } from "features/map/hooks/useHoverClose";
import {
  LayerMouseEvent,
  useLayerEvents,
} from "features/map/hooks/useLayerEvents";
import { useMapImage } from "features/map/hooks/useMapImage";
import { toPointFeatureCollection } from "features/map/utils/geojson";
import {
  createStopFlagFar,
  createStopFlagFarSelected,
  createStopFlagNear,
  createStopFlagNearSelected,
  SELECTED_RED,
} from "features/map/utils/mapSprites";
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
const STOPS_HOVER_LAYER_ID = "stops-hover";
const STOP_LAYER_IDS = [STOPS_LAYER_ID];
const STOPS_SOURCE_ID = "stops-source";

// Baked two-color "bus stop flag" sprites (see mapSprites.ts). The far
// variant is a plain rounded square — the glyph is unreadable below ~14px.
const FLAG_FAR_IMAGE_ID = "stop-flag-far";
const FLAG_FAR_SELECTED_IMAGE_ID = "stop-flag-far-selected";
const FLAG_NEAR_IMAGE_ID = "stop-flag";
const FLAG_NEAR_SELECTED_IMAGE_ID = "stop-flag-selected";

/** Zoom at which the flag gains its bus glyph. */
const GLYPH_ZOOM = 13;

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

  useMapImage(FLAG_FAR_IMAGE_ID, createStopFlagFar);
  useMapImage(FLAG_FAR_SELECTED_IMAGE_ID, createStopFlagFarSelected);
  useMapImage(FLAG_NEAR_IMAGE_ID, createStopFlagNear);
  useMapImage(FLAG_NEAR_SELECTED_IMAGE_ID, createStopFlagNearSelected);

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
      // Stop clicks are consumed before the background handler, so clear
      // any pinned vehicle popup here explicitly
      setPinnedVehicle(undefined);
      setHoveringVehicle(undefined);
      if (isMobile) {
        // Mobile: tap shows the peek sheet instead of navigating away
        setHoveringStop(stop);
      } else {
        setSelectedStop(stop);
      }
    },
    [
      isMobile,
      stopsById,
      setHoveringStop,
      setHoveringVehicle,
      setPinnedVehicle,
      setSelectedStop,
    ]
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
      {/* Hover ring under the flag. Flag sprites are baked (two-color, so
          not SDF-recolorable) and layout properties can't read
          feature-state, so hover feedback lives in this underlay. */}
      <Layer
        id={STOPS_HOVER_LAYER_ID}
        paint={{
          "circle-color": SELECTED_RED,
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "hovered"], false],
            0.25,
            0,
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            7,
            11,
            9,
            14,
            15,
            18,
            21,
          ],
          "circle-stroke-color": SELECTED_RED,
          "circle-stroke-opacity": [
            "case",
            ["boolean", ["feature-state", "hovered"], false],
            0.9,
            0,
          ],
          "circle-stroke-width": 2,
        }}
        slot={"top"}
        type={"circle"}
      />
      {/* Single symbol layer for flags + labels. The native collision engine
          declutters both: flags thin out at low zoom (icon-padding widens the
          collision box), and labels drop before flags do (text-optional).
          On route pages (disableLod) every stop must stay visible, so icons
          are allowed to overlap. */}
      <Layer
        id={STOPS_LAYER_ID}
        layout={{
          "icon-allow-overlap": disableLod,
          // Plain square when far; bus-glyph flag when near. Selected stop
          // gets the red variant (data expressions work in layout,
          // feature-state does not).
          "icon-image": [
            "step",
            ["zoom"],
            [
              "case",
              ["==", ["get", "stopId"], selectedStopId],
              FLAG_FAR_SELECTED_IMAGE_ID,
              FLAG_FAR_IMAGE_ID,
            ],
            GLYPH_ZOOM,
            [
              "case",
              ["==", ["get", "stopId"], selectedStopId],
              FLAG_NEAR_SELECTED_IMAGE_ID,
              FLAG_NEAR_IMAGE_ID,
            ],
          ],
          // Wider collision box at low zoom = fewer, better-spaced flags
          "icon-padding": ["interpolate", ["linear"], ["zoom"], 8, 10, 13, 2],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            6,
            0.125,
            11,
            0.19,
            14,
            0.33,
            18,
            0.5,
          ],
          "symbol-sort-key": ["get", "priority"],
          // Labels only at zoom 10+; collision then hides overlaps
          "text-field": ["step", ["zoom"], "", 10, ["get", "stopName"]],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          // Drop the label under collision pressure but keep the flag
          "text-optional": true,
          "text-radial-offset": 0.8,
          "text-size": 12,
          // Let labels slide to whichever side fits — places more labels
          // in dense areas than a fixed anchor
          "text-variable-anchor": ["right", "left", "top", "bottom"],
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
        slot={"top"}
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
