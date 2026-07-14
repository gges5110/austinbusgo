import { Box, Tooltip, Typography } from "@mui/material";
import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Stop } from "shared/api/generated/model";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";

interface StopRoutesProps {
  routes: Stop["routes"];
}

export const StopRoutes: React.FC<StopRoutesProps> = ({ routes }) => {
  const { viewStatePathname } = useViewStatePathname();

  if (!routes || routes.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
      }}
    >
      <Typography
        sx={{
          color: "text.secondary",
          mb: 0.5,
        }}
        variant={"caption"}
      >
        Routes at this stop
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {routes.map((route) => (
          <Tooltip key={route.routeId} title={route.routeLongName}>
            <RouterLink
              style={{ textDecoration: "none" }}
              to={`/route/${route.routeId}/direction/0${viewStatePathname}`}
            >
              <RouteIdDisplay
                routeColor={route.routeColor}
                routeId={route.routeShortName || route.routeId}
              />
            </RouterLink>
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};
