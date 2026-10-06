import { useTheme } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { MapHoverPopup } from "features/map/components/MapHoverPopup";
import { useAnimatedVehicleSource } from "features/map/hooks/useAnimatedVehicleSource";
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
  createStoppedDot,
  createTeardropIncoming,
  createTeardropTransit,
  SELECTED_RED,
  VEHICLE_INCOMING_ORANGE,
  VEHICLE_STOPPED_RED,
  VEHICLE_TRANSIT_BLUE,
} from "features/map/utils/mapSprites";
import { useAtom, useSetAtom } from "jotai";
import * as React from "react";
import { FC, useCallback, useMemo } from "react";
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
const VEHICLE_STATUS_LAYER_ID = "vehicle-status-label";
const VEHICLE_LAYER_IDS = [VEHICLES_LAYER_ID];
const VEHICLES_SOURCE_ID = "vehicles-source";

const TEARDROP_TRANSIT_IMAGE_ID = "vehicle-teardrop-transit";
const TEARDROP_INCOMING_IMAGE_ID = "vehicle-teardrop-incoming";
const STOPPED_DOT_IMAGE_ID = "vehicle-dot-stopped";
const BUS_GLYPH_IMAGE_ID = "vehicle-bus-glyph";

// Stable empty collection: the source data is driven imperatively by
// useAnimatedVehicleSource; react-map-gl must never reset it on re-render
const EMPTY_VEHICLES: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

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

  const closeHoverPopup = useCallback(
    () => setHoveringVehicle(undefined),
    [setHoveringVehicle]
  );
  const { scheduleClose, cancelClose } = useHoverClose(closeHoverPopup);

  useMapImage(TEARDROP_TRANSIT_IMAGE_ID, createTeardropTransit);
  useMapImage(TEARDROP_INCOMING_IMAGE_ID, createTeardropIncoming);
  useMapImage(STOPPED_DOT_IMAGE_ID, createStoppedDot);
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

  // Glide markers between polls instead of teleporting them
  useAnimatedVehicleSource(
    VEHICLES_SOURCE_ID,
    vehiclesGeoJSON as GeoJSON.FeatureCollection<GeoJSON.Point>
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

  // Background click (vehicle/stop clicks are consumed by their own
  // interactions and never reach this): dismiss the pinned popup
  const handleMapClick = useCallback(() => {
    setPinnedVehicle(undefined);
    setHoveringVehicle(undefined);
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
      data={EMPTY_VEHICLES}
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
        slot={"top"}
        type={"circle"}
      />

      {/* Vehicle marker: a teardrop pointing along the heading for moving/
          approaching vehicles, or a non-directional dot when stopped (a
          stationary bus shouldn't imply a direction of travel). */}
      <Layer
        id={VEHICLES_LAYER_ID}
        layout={{
          "icon-allow-overlap": true,
          "icon-image": [
            "match",
            ["get", "currentStatus"],
            "STOPPED_AT",
            STOPPED_DOT_IMAGE_ID,
            "INCOMING_AT",
            TEARDROP_INCOMING_IMAGE_ID,
            /* IN_TRANSIT_TO + default */ TEARDROP_TRANSIT_IMAGE_ID,
          ],
          // Stopped vehicles use a symmetric dot, so keep it unrotated;
          // everything else points along the reported bearing.
          "icon-rotate": [
            "case",
            ["==", ["get", "currentStatus"], "STOPPED_AT"],
            0,
            ["get", "bearing"],
          ],
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
        slot={"top"}
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
        slot={"top"}
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
        slot={"top"}
        type={"symbol"}
      />

      {/* Status word under the teardrop (issue #77: read a vehicle's stop
          status without opening the popup). Kept clutter-free by showing
          only for the hovered/pinned vehicle — gated by the same
          feature-state as the hover ring (synced by useFeatureHoverState). */}
      <Layer
        id={VEHICLE_STATUS_LAYER_ID}
        layout={{
          "text-allow-overlap": true,
          "text-field": [
            "match",
            ["get", "currentStatus"],
            "STOPPED_AT",
            "STOPPED",
            "INCOMING_AT",
            "ARRIVING",
            "IN_TRANSIT_TO",
            "IN TRANSIT",
            "",
          ],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.6],
          "text-size": 11,
        }}
        paint={{
          "text-color": [
            "match",
            ["get", "currentStatus"],
            "STOPPED_AT",
            VEHICLE_STOPPED_RED,
            "INCOMING_AT",
            VEHICLE_INCOMING_ORANGE,
            VEHICLE_TRANSIT_BLUE,
          ],
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
          "text-opacity": [
            "case",
            ["boolean", ["feature-state", "hovered"], false],
            1,
            0,
          ],
        }}
        slot={"top"}
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
