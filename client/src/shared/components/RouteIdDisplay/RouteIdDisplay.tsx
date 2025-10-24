import { Box, Typography } from "@mui/material";
import * as React from "react";
import { MouseEventHandler } from "react";
import { Route } from "shared/types/interface.d";

interface RouteIdDisplayProps {
  routeColor: Route["routeColor"];
  routeId: string;
  onClick?: MouseEventHandler;
}

export const RouteIdDisplay: React.FC<RouteIdDisplayProps> = ({
  routeColor,
  routeId,
  onClick,
}) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        backgroundColor: `#${routeColor}`,
        color: "white",
        width: "fit-content",
        minWidth: 44,
        height: "fit-content",
        px: 1,
        borderRadius: "7px",
        textAlign: "center",
      }}
    >
      <Typography sx={{ fontWeight: "bold" }}>{routeId}</Typography>
    </Box>
  );
};
