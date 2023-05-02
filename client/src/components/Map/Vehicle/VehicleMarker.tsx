import { Popover } from "@mui/material";
import { useState } from "react";
import * as React from "react";
import { Marker } from "react-map-gl";
import { VehiclePosition } from "../../../interfaces/interface.d";
import { VehicleIcon } from "./VehicleIcon";
import { VehiclePopupContainer } from "./VehiclePopupContainer";

interface VehicleMarkerProps {
  readonly vehiclePosition: VehiclePosition;
  readonly onClick: (vehiclePosition: VehiclePosition) => void;
}

export const VehicleMarker: React.FunctionComponent<VehicleMarkerProps> = ({
  vehiclePosition,
  onClick,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOnClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    onClick(vehiclePosition);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const { position } = vehiclePosition;
  return (
    <React.Fragment>
      <Marker
        longitude={position?.longitude || 0}
        latitude={position?.latitude || 0}
        key={vehiclePosition?.vehicle?.id || ""}
      >
        <VehicleIcon bearing={position?.bearing || 0} onClick={handleOnClick} />
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
      >
        <VehiclePopupContainer vehiclePosition={vehiclePosition} />
      </Popover>
    </React.Fragment>
  );
};
