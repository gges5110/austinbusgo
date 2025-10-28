import LocationOnIcon from "@mui/icons-material/LocationOn";
import { Box } from "@mui/material";
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
}: StopPinProps) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        // Center the badge - it will be the anchor point
        width: 24,
        height: 24,
      }}
    >
      {/* Circular badge similar to Google Maps - this is the anchor point */}
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: highlighted ? "#EA4335" : "#1A73E8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          border: "2px solid white",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "scale(1.1)",
            boxShadow: "0 3px 8px rgba(0,0,0,0.4)",
          },
        }}
      >
        <LocationOnIcon
          sx={{
            fontSize: 14,
            color: "white",
          }}
        />
      </Box>

      {/* Stop name text - absolutely positioned to the right of the badge */}
      <Box
        sx={{
          position: "absolute",
          left: 28,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 13,
          fontWeight: 500,
          color: "#202124",
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          padding: "2px 6px",
          borderRadius: "2px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          whiteSpace: "nowrap",
        }}
      >
        {stopName}
      </Box>
    </Box>
  );
};
