import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import RouteIcon from "@mui/icons-material/Route";
import { Box, Typography } from "@mui/material";
import * as React from "react";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";
import { Route } from "shared/types/interface.d";

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
