import { Box, Divider } from "@mui/material";
import { useDataFromLoader } from "app/Router";
import { RouteStopsTimeline } from "features/route/components/RouteStopsTimeline/RouteStopsTimeline";
import { DirectionToggle } from "features/search/components/SearchPanel/DirectionToggle/DirectionToggle";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AddToFavorites } from "shared/components/AddToFavorites/AddToFavorites";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";
import { RouteDisplayBanner } from "shared/components/RouteDisplayBanner/RouteDisplayBanner";
import { ShareButton } from "shared/components/ShareButton/ShareButton";
import { useTitle } from "shared/hooks/UseTitle";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { Trip } from "shared/types/interface.d";

import { routeLoader } from "./RouteLoader";

export const RouteMenu = () => {
  const navigate = useNavigate();
  const { stops, distinctTrips, route } = useDataFromLoader(routeLoader);
  const { routeId, directionId } = useParams();

  const { viewStatePathname } = useViewStatePathname();

  useTitle(`${route.routeId} ${route.routeLongName} - Austin Bus Go`);

  const setDirection = (directionId: Trip["directionId"]) => {
    if (directionId !== undefined) {
      navigate(
        `/route/${routeId}/direction/${directionId}${viewStatePathname}`,
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
