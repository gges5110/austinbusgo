import { IconButton, Tooltip } from "@mui/material";
import { blue, red } from "@mui/material/colors";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import React, { useState } from "react";

export interface StopPinProps {
  readonly stopName: string;
  readonly highlighted?: boolean;

  onClick?(): void;
}

export const StopPin: React.FunctionComponent<StopPinProps> = ({
  onClick,
  stopName,
  highlighted,
}: StopPinProps) => {
  const [open, setOpen] = useState(false);
  // Consider showing stop name when zoom is below 12
  return (
    <Tooltip
      onClose={() => {
        setOpen(false);
      }}
      onOpen={() => {
        setOpen(true);
      }}
      open={highlighted || open}
      placement={"left"}
      title={stopName}
    >
      <IconButton onClick={onClick} size={"small"}>
        <LocationOnIcon
          fontSize={"small"}
          style={{ color: highlighted ? red[500] : blue[500] }}
          sx={{ fontSize: highlighted ? 36 : undefined }}
        />
      </IconButton>
    </Tooltip>
  );
};
