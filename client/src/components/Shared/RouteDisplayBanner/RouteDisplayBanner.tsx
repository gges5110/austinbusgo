import { Route } from "../../../interfaces/interface.d";
import * as React from "react";
import { Box, Typography } from "@mui/material";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { RouteIdDisplay } from "../RouteIdDisplay/RouteIdDisplay";
import RouteIcon from "@mui/icons-material/Route";

interface RouteDisplayBannerProps {
  routeColor: Route["routeColor"];
  routeId: string;
  routeName: string;
  useBusIcon?: boolean;
}

export const RouteDisplayBanner: React.FC<RouteDisplayBannerProps> = ({
  routeId,
  routeColor,
  routeName,
  useBusIcon = false,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {useBusIcon ? <DirectionsBusIcon /> : <RouteIcon />}
      <RouteIdDisplay routeColor={routeColor} routeId={routeId} />
      <Typography variant={"subtitle1"}>{routeName}</Typography>
    </Box>
  );
};
