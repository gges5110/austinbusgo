import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { Box, Typography } from "@mui/material";
import * as React from "react";
import { Link } from "react-router-dom";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { Stop } from "shared/types/interface.d";

interface StopPopupContentProps {
  readonly stop: Stop;
}

export const StopPopupContent: React.FC<StopPopupContentProps> = ({ stop }) => {
  const { viewStatePathname, withPreservedSearch } = useViewStatePathname();

  return (
    <Box display={"flex"} flexDirection={"column"} gap={1} minWidth={200}>
      <Box alignItems={"center"} display={"flex"} gap={1}>
        <PlaceOutlinedIcon sx={{ fontSize: 20 }} />
        <Typography fontWeight={600} variant={"body2"}>
          {stop.stopName}
        </Typography>
      </Box>
      {stop.stopCode && (
        <Typography color={"textSecondary"} fontSize={12} variant={"body2"}>
          Stop #{stop.stopCode}
        </Typography>
      )}
      {stop.routes && stop.routes.length > 0 && (
        <Box display={"flex"} flexWrap={"wrap"} gap={0.5}>
          {stop.routes.map((route) => (
            <Link
              key={route.routeId}
              style={{ textDecoration: "none" }}
              to={`/route/${route.routeId}/direction/0${viewStatePathname}${withPreservedSearch()}`}
            >
              <RouteIdDisplay
                routeColor={route.routeColor}
                routeId={route.routeId}
              />
            </Link>
          ))}
        </Box>
      )}
    </Box>
  );
};
