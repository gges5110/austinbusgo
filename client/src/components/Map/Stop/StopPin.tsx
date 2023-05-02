import { IconButton, Tooltip } from "@mui/material";
import { blue, red } from "@mui/material/colors";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import React from "react";

export interface StopPinProps {
  readonly stopName: string;
  readonly highlighted?: boolean;

  onClick?(): void;
}

export const StopPin: React.FunctionComponent<StopPinProps> = ({
  onClick,
  stopName,
  highlighted,
}: StopPinProps) => (
  <Tooltip title={stopName} open={highlighted}>
    <IconButton onClick={onClick} size={"small"}>
      <LocationOnIcon
        sx={{ fontSize: highlighted ? 36 : undefined }}
        fontSize={"small"}
        style={{ color: highlighted ? red[500] : blue[500] }}
      />
    </IconButton>
  </Tooltip>
);
