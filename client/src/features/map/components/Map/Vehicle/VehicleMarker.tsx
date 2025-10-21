import { Badge, Popover } from "@mui/material";
import { useRef, useState } from "react";
import * as React from "react";
import { Marker } from "react-map-gl";
import { VehiclePosition } from "../../../../../shared/types/interface.d";
import { VehicleIcon } from "./VehicleIcon";
import { VehiclePopupContainer } from "./VehiclePopupContainer";
import { useAtomValue } from "jotai";
import { hoveringVehiclePositionAtom } from "../../../../../shared/state/atoms";

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
  const [open, setOpen] = useState<boolean>(false);
  const ref = useRef<HTMLButtonElement | null>(null);
  const handleOnClick = (): void => {
    onClick(vehiclePosition);
  };

  const handlePopoverOpen = () => {
    setOpen(true);
  };

  const handlePopoverClose = () => {
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const { position } = vehiclePosition;
  return (
    <React.Fragment>
      <Marker
        key={vehiclePosition?.vehicle?.id || ""}
        latitude={position?.latitude || 0}
        longitude={position?.longitude || 0}
      >
        <Badge
          badgeContent={vehiclePosition?.trip?.routeId}
          color={"primary"}
          max={999}
          overlap={"circular"}
        >
          <VehicleIcon
            bearing={Number(position?.bearing) || 0}
            highlighted={isHighlighted}
            innerRef={ref}
            onClick={handleOnClick}
            onMouseEnter={handlePopoverOpen}
            onMouseLeave={handlePopoverClose}
          />
        </Badge>
      </Marker>
      <Popover
        anchorEl={ref.current}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        onClose={handleClose}
        open={open || isHighlighted}
        sx={{
          pointerEvents: "none",
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
