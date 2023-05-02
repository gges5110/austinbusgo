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
  return (
    <Tooltip
      title={stopName}
      open={highlighted || open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
    >
      <IconButton onClick={onClick} size={"small"}>
        <LocationOnIcon
          sx={{ fontSize: highlighted ? 36 : undefined }}
          fontSize={"small"}
          style={{ color: highlighted ? red[500] : blue[500] }}
        />
      </IconButton>
    </Tooltip>
  );
};
