import { Box } from "@mui/material";
import * as React from "react";
import { VehicleStopStatus } from "shared/types/interface.d";

const getStatusDisplay = (
  status: VehicleStopStatus | null | undefined
): { text: string; color: string } => {
  switch (status) {
    case VehicleStopStatus.IncomingAt:
      return { text: "ARRIVING", color: "#ff9800" }; // Orange
    case VehicleStopStatus.StoppedAt:
      return { text: "STOPPED", color: "#f44336" }; // Red
    case VehicleStopStatus.InTransitTo:
      return { text: "IN TRANSIT", color: "#4caf50" }; // Green
    default:
      return { text: "", color: "" };
  }
};

export interface VehicleStatusBadgeProps {
  readonly status: VehicleStopStatus | null | undefined;
}

export const VehicleStatusBadge: React.FunctionComponent<
  VehicleStatusBadgeProps
> = ({ status }) => {
  const { text, color } = getStatusDisplay(status);

  if (!text) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "absolute",
        top: -8,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: color,
        color: "white",
        fontSize: 9,
        fontWeight: 600,
        padding: "2px 4px",
        borderRadius: 1,
        whiteSpace: "nowrap",
        boxShadow: 1,
        pointerEvents: "none",
      }}
    >
      {text}
    </Box>
  );
};
