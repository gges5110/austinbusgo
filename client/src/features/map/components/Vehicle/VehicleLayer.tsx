import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MapHoverPopup } from "features/map/components/MapHoverPopup";
import { useFeatureHoverState } from "features/map/hooks/useFeatureHoverState";
import { useHoverClose } from "features/map/hooks/useHoverClose";
import {
  LayerMouseEvent,
  useLayerEvents,
  useMapClick,
} from "features/map/hooks/useLayerEvents";
import { useMapImage } from "features/map/hooks/useMapImage";
import { toPointFeatureCollection } from "features/map/utils/geojson";
import {
  createBusGlyph,
  createTeardropIncoming,
  createTeardropStopped,
  createTeardropTransit,
  SELECTED_RED,
  VEHICLE_INCOMING_ORANGE,
  VEHICLE_STOPPED_RED,
  VEHICLE_TRANSIT_BLUE,
} from "features/map/utils/mapSprites";
import { useAtom, useSetAtom } from "jotai";
import * as React from "react";
import { FC, useCallback, useMemo, useRef } from "react";
import { Layer, Source } from "react-map-gl/mapbox";
import { useNavigate } from "react-router-dom";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import {
  hoveringStopAtom,
  hoveringVehiclePositionAtom,
  pinnedVehiclePositionAtom,
} from "shared/state/atoms";
import { VehiclePosition } from "shared/types/interface.d";

import { VehiclePeekSheet } from "./VehiclePeekSheet";
import { VehiclePopupContainer } from "./VehiclePopupContainer";

export const VEHICLES_LAYER_ID = "vehicle-markers";
const VEHICLES_HOVER_LAYER_ID = "vehicle-markers-hover";
const VEHICLE_GLYPHS_LAYER_ID = "vehicle-glyphs";
const VEHICLE_LABELS_LAYER_ID = "vehicle-labels";
const VEHICLE_LAYER_IDS = [VEHICLES_LAYER_ID];
const VEHICLES_SOURCE_ID = "vehicles-source";

const TEARDROP_TRANSIT_IMAGE_ID = "vehicle-teardrop-transit";
const TEARDROP_INCOMING_IMAGE_ID = "vehicle-teardrop-incoming";
const TEARDROP_STOPPED_IMAGE_ID = "vehicle-teardrop-stopped";
const BUS_GLYPH_IMAGE_ID = "vehicle-bus-glyph";

interface VehicleLayerProps {
  readonly vehiclePositions: VehiclePosition[];
}

export const VehicleLayer: FC<VehicleLayerProps> = ({ vehiclePositions }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();
  const [hoveringVehicle, setHoveringVehicle] = useAtom(
    hoveringVehiclePositionAtom
  );
  // Separate "pinned" state — set on click, cleared by clicking the map background
  const [pinnedVehicle, setPinnedVehicle] = useAtom(pinnedVehiclePositionAtom);
  const setHoveringStop = useSetAtom(hoveringStopAtom);
  // Ref flag so the map-level click handler can tell if a vehicle circle was just clicked
  const vehicleJustClickedRef = useRef(false);

  const closeHoverPopup = useCallback(
    () => setHoveringVehicle(undefined),
    [setHoveringVehicle]
  );
  const { scheduleClose, cancelClose } = useHoverClose(closeHoverPopup);

  useMapImage(TEARDROP_TRANSIT_IMAGE_ID, createTeardropTransit);
  useMapImage(TEARDROP_INCOMING_IMAGE_ID, createTeardropIncoming);
  useMapImage(TEARDROP_STOPPED_IMAGE_ID, createTeardropStopped);
  useMapImage(BUS_GLYPH_IMAGE_ID, createBusGlyph);

  // Lookup map for click/hover resolution
  const vehiclesById = useMemo(() => {
    const m = new Map<string, VehiclePosition>();
    for (const vp of vehiclePositions) {
      if (vp.vehicle?.id) m.set(vp.vehicle.id, vp);
    }
    return m;
  }, [vehiclePositions]);

  const vehiclesGeoJSON = useMemo(
    () =>
      toPointFeatureCollection(
        vehiclePositions,
        (vp) =>
          vp.position
            ? [vp.position.longitude, vp.position.latitude]
            : undefined,
        (vp) => ({
          bearing: vp.position?.bearing ?? 0,
          currentStatus: vp.currentStatus ?? "",
          routeId: vp.trip?.routeId ?? "",
          vehicleId: vp.vehicle?.id ?? "",
        })
      ),
    [vehiclePositions]
  );

  // Sync hoveringVehicle atom → Mapbox feature state for circle highlight
  useFeatureHoverState(
    VEHICLES_SOURCE_ID,
    hoveringVehicle?.vehicle?.id ?? pinnedVehicle?.vehicle?.id
  );

  const handleMouseEnter = useCallback(
    (e: LayerMouseEvent) => {
      cancelClose();
      setHoveringStop(undefined);
      const vehicleId = e.features?.[0]?.properties?.vehicleId as
        | string
        | undefined;
      if (vehicleId && vehiclesById.has(vehicleId)) {
        setHoveringVehicle(vehiclesById.get(vehicleId));
      }
    },
    [cancelClose, setHoveringStop, vehiclesById, setHoveringVehicle]
  );

  const handleClick = useCallback(
    (e: LayerMouseEvent) => {
      const vehicleId = e.features?.[0]?.properties?.vehicleId as
        | string
        | undefined;
      const vp = vehicleId ? vehiclesById.get(vehicleId) : undefined;
      if (!vp) return;
      // Mark that this click was on a vehicle so the map background handler
      // does not immediately clear the pinned popup
      vehicleJustClickedRef.current = true;
      setHoveringStop(undefined);
      setPinnedVehicle(vp);
      if (!isMobile) {
        const routeId = vp.trip?.routeId;
        if (routeId) {
          navigate(`/route/${routeId}/direction/0${viewStatePathname}`);
        }
      }
    },
    [
      isMobile,
      navigate,
      setHoveringStop,
      setPinnedVehicle,
      vehiclesById,
      viewStatePathname,
    ]
  );

  // Map background click: dismiss the pinned popup when clicking outside a vehicle
  const handleMapClick = useCallback(() => {
    if (!vehicleJustClickedRef.current) {
      setPinnedVehicle(undefined);
      setHoveringVehicle(undefined);
    }
    vehicleJustClickedRef.current = false;
  }, [setPinnedVehicle, setHoveringVehicle]);

  useLayerEvents(VEHICLE_LAYER_IDS, {
    onClick: handleClick,
    onMouseEnter: isMobile ? undefined : handleMouseEnter,
    onMouseLeave: isMobile ? undefined : scheduleClose,
  });
  useMapClick(handleMapClick);

  const popupVehicle = pinnedVehicle ?? hoveringVehicle;
  const popupPosition = popupVehicle?.position;

  const closePopup = useCallback(() => {
    setPinnedVehicle(undefined);
    setHoveringVehicle(undefined);
  }, [setPinnedVehicle, setHoveringVehicle]);

  return (
    <Source
      data={vehiclesGeoJSON}
      id={VEHICLES_SOURCE_ID}
      promoteId={"vehicleId"}
      type={"geojson"}
    >
      {/* Hover ring under the teardrop (baked sprites can't recolor on
          feature-state, so hover feedback lives in this underlay) */}
      <Layer
        id={VEHICLES_HOVER_LAYER_ID}
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
            10,
            11,
            14,
            15,
            18,
            20,
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
        type={"circle"}
      />

      {/* Teardrop marker: bulb centered on the vehicle position, tip
          rotated to the heading — replaces the old circle + chevron */}
      <Layer
        id={VEHICLES_LAYER_ID}
        layout={{
          "icon-allow-overlap": true,
          "icon-image": [
            "match",
            ["get", "currentStatus"],
            "STOPPED_AT",
            TEARDROP_STOPPED_IMAGE_ID,
            "INCOMING_AT",
            TEARDROP_INCOMING_IMAGE_ID,
            /* IN_TRANSIT_TO + default */ TEARDROP_TRANSIT_IMAGE_ID,
          ],
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.35,
            14,
            0.5,
            18,
            0.68,
          ],
        }}
        type={"symbol"}
      />

      {/* Bus glyph: separate viewport-aligned layer so the bus stays
          upright while the teardrop under it rotates with the bearing */}
      <Layer
        id={VEHICLE_GLYPHS_LAYER_ID}
        layout={{
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-image": BUS_GLYPH_IMAGE_ID,
          "icon-size": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            0.26,
            14,
            0.36,
            18,
            0.5,
          ],
        }}
        type={"symbol"}
      />

      {/* Label layer: route ID above the circle */}
      <Layer
        id={VEHICLE_LABELS_LAYER_ID}
        layout={{
          "text-allow-overlap": false,
          "text-field": ["get", "routeId"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, -2.2],
          "text-size": 11,
        }}
        paint={{
          "text-color": "#ffffff",
          "text-halo-color": [
            "match",
            ["get", "currentStatus"],
            "STOPPED_AT",
            VEHICLE_STOPPED_RED,
            "INCOMING_AT",
            VEHICLE_INCOMING_ORANGE,
            VEHICLE_TRANSIT_BLUE,
          ],
          "text-halo-width": 1.5,
        }}
        type={"symbol"}
      />

      {/* Mobile: peek sheet on tap */}
      {isMobile && popupVehicle && (
        <VehiclePeekSheet
          onClose={closePopup}
          open={true}
          vehiclePosition={popupVehicle}
        />
      )}
      {/* Desktop: hover/pinned popup anchored to the map */}
      {!isMobile && popupVehicle && popupPosition && (
        <MapHoverPopup
          latitude={popupPosition.latitude}
          longitude={popupPosition.longitude}
          offset={20}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <VehiclePopupContainer vehiclePosition={popupVehicle} />
        </MapHoverPopup>
      )}
    </Source>
  );
};
