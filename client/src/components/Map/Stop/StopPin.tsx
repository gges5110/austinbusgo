import { IconButton, Tooltip } from "@mui/material";
import { blue } from "@mui/material/colors";
import LocationOnIcon from "@mui/icons-material/LocationOn";
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
