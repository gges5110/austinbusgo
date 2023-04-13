import { IconButton, Tooltip } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import React from "react";

export interface StopPinProps {
  readonly stopName: string;
  onClick?(): void;
}

export const StopPin: React.FunctionComponent<StopPinProps> = ({
  onClick,
  stopName,
}: StopPinProps) => (
  <Tooltip title={stopName}>
    <IconButton onClick={onClick} size={"small"}>
      <LocationOnIcon fontSize={"small"} style={{ color: blue[500] }} />
    </IconButton>
  </Tooltip>
);
