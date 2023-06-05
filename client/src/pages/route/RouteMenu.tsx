import { useNavigate, useParams } from "react-router-dom";
import { Box, Divider } from "@mui/material";
import { DirectionToggle } from "../../components/SearchPanel/DirectionToggle/DirectionToggle";
import { RouteStopsTimeline } from "../../components/Route/RouteStopsTimeline/RouteStopsTimeline";
import * as React from "react";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import { useTitle } from "../../hooks/UseTitle";
import { useDataFromLoader } from "../../Router";
import { Trip } from "../../interfaces/interface.d";
import { MenuPanel } from "../../components/Shared/MenuPanel/MenuPanel";
import { routeLoader } from "./RouteLoader";
import { AddToFavorites } from "../../components/Shared/AddToFavorites/AddToFavorites";
import { ShareButton } from "../../components/Shared/ShareButton/ShareButton";
import { RouteDisplayBanner } from "../../components/Shared/RouteDisplayBanner/RouteDisplayBanner";

export const RouteMenu = () => {
  const navigate = useNavigate();
  const { stops, distinctTrips, route } = useDataFromLoader(routeLoader);
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
        <Box py={1}>
          <RouteDisplayBanner
            routeColor={route.routeColor}
            routeId={route.routeId}
            routeName={route.routeLongName}
          />
        </Box>
        <Box sx={{ pl: 4 }}>
          <DirectionToggle
            directionId={Number(directionId)}
            distinctTrips={distinctTrips}
            setDirection={setDirection}
          />
        </Box>
      </Box>
      <Box display={"flex"} px={"22px"} py={"10px"}>
        <AddToFavorites value={route} />
        <ShareButton />
      </Box>
      <Divider />

      <RouteStopsTimeline route={route} stops={stops} />
    </MenuPanel>
  );
};
