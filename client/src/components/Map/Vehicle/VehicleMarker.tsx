import { Badge, Popover } from "@mui/material";
import { useState } from "react";
import * as React from "react";
import { Marker } from "react-map-gl";
import { VehiclePosition } from "../../../interfaces/interface.d";
import { VehicleIcon } from "./VehicleIcon";
import { VehiclePopupContainer } from "./VehiclePopupContainer";
import { useAtomValue } from "jotai";
import { hoveringVehiclePositionAtom } from "../../../Atoms";

interface VehicleMarkerProps {
  readonly vehiclePosition: VehiclePosition;
  readonly onClick: (vehiclePosition: VehiclePosition) => void;
}

export const VehicleMarker: React.FunctionComponent<VehicleMarkerProps> = ({
  vehiclePosition,
  onClick,
}) => {
  const hoveringVehiclePosition = useAtomValue(hoveringVehiclePositionAtom);
  const isHighlighted =
    hoveringVehiclePosition?.vehicle?.id === vehiclePosition.vehicle?.id;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOnClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
    onClick(vehiclePosition);
  };

  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // TODO: fix anchorEl on hovering
  const open = Boolean(anchorEl) || isHighlighted;
  const { position } = vehiclePosition;
  return (
    <React.Fragment>
      <Marker
        longitude={position?.longitude || 0}
        latitude={position?.latitude || 0}
        key={vehiclePosition?.vehicle?.id || ""}
      >
        <Badge
          badgeContent={vehiclePosition?.trip?.routeId}
          color={"primary"}
          overlap="circular"
          max={999}
        >
          <VehicleIcon
            bearing={Number(position?.bearing) || 0}
            onClick={handleOnClick}
            onMouseEnter={handlePopoverOpen}
            onMouseLeave={handlePopoverClose}
            highlighted={isHighlighted}
          />
        </Badge>
      </Marker>
      <Popover
        open={open}
        onClose={handleClose}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        sx={{
          pointerEvents: "none",
        }}
      >
        <VehiclePopupContainer vehiclePosition={vehiclePosition} />
      </Popover>
    </React.Fragment>
  );
};
