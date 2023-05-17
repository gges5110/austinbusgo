import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { DirectionToggle } from "../../components/SearchPanel/DirectionToggle/DirectionToggle";
import { RouteStopsTimeline } from "../../components/Route/RouteStopsTimeline/RouteStopsTimeline";
import * as React from "react";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import { useTitle } from "../../hooks/UseTitle";
import { useDataFromLoader } from "../../Router";
import RouteIcon from "@mui/icons-material/Route";
import { RouteIdDisplay } from "../../components/RouteIdDisplay/RouteIdDisplay";
import { Trip } from "../../interfaces/interface.d";
import { MenuPanel } from "../../components/MenuPanel";
import { routeLoader } from "./RouteLoader";

export const RouteMenu = () => {
  const navigate = useNavigate();
  const { stops, distinctTrips, route, vehiclePositions } = useDataFromLoader(
    routeLoader
  );
  const { routeId, directionId } = useParams();

  const { viewStatePathname } = useViewStatePathname();

  useTitle(`${route.routeId} ${route.routeLongName} - Austin Bus Go`);

  const setDirection = (directionId: Trip["directionId"]) => {
    if (directionId !== undefined) {
      navigate(
        `${viewStatePathname}/route/${routeId}/direction/${directionId}`,
        {
          replace: true,
        }
      );
    }
  };

  return (
    <MenuPanel>
      <Box
        sx={{
          py: 1,
          boxShadow: 2,
          width: "100%",
        }}
      >
        <Box
          component={"div"}
          display={"flex"}
          gap={1}
          justifyContent={"center"}
          alignItems={"center"}
          sx={{ py: 1 }}
        >
          <RouteIcon />
          <RouteIdDisplay
            routeColor={route.routeColor}
            routeId={route.routeId}
          />
          <Typography sx={{ fontSize: "18px" }}>
            {route.routeLongName}
          </Typography>
        </Box>
        <Box sx={{ pl: 4 }}>
          <DirectionToggle
            directionId={Number(directionId)}
            setDirection={setDirection}
            distinctTrips={distinctTrips}
          />
        </Box>
      </Box>

      <RouteStopsTimeline
        route={route}
        stops={stops}
        vehiclePositions={vehiclePositions || []}
      />
    </MenuPanel>
  );
};
