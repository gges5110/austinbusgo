import { Box } from "@mui/material";
import * as React from "react";
import { VehicleStopStatus } from "shared/types/interface.d";

// Visual constants for status badge positioning and styling
const BADGE_TOP_OFFSET = -8; // Position above the vehicle icon
const BADGE_FONT_SIZE = 9; // Small font to avoid clutter

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
        top: BADGE_TOP_OFFSET,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: color,
        color: "white",
        fontSize: BADGE_FONT_SIZE,
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
