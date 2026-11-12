import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Box,
  Collapse,
  Divider,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useDataFromLoader } from "app/Router";
import { RouteNextBus } from "features/route/components/RouteNextBus/RouteNextBus";
import { RouteStopsTimeline } from "features/route/components/RouteStopsTimeline/RouteStopsTimeline";
import { DirectionToggle } from "features/search/components/SearchPanel/DirectionToggle/DirectionToggle";
import * as React from "react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AddToFavorites } from "shared/components/AddToFavorites/AddToFavorites";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";
import { RouteDisplayBanner } from "shared/components/RouteDisplayBanner/RouteDisplayBanner";
import { ShareButton } from "shared/components/ShareButton/ShareButton";
import { useTitle } from "shared/hooks/UseTitle";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { Trip } from "shared/types/interface.d";
import { routeDisplayName } from "shared/utils/routeNames";

import { routeLoader } from "./RouteLoader";

export const RouteMenu = () => {
  const navigate = useNavigate();
  const { stops, distinctTrips, route } = useDataFromLoader(routeLoader);
  const { routeId, directionId } = useParams();

  const { viewStatePathname } = useViewStatePathname();
  const [showAllStops, setShowAllStops] = useState(false);

  useTitle(`${route.routeId} ${routeDisplayName(route)} - Austin Bus Go`);

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
      <Box sx={{ boxShadow: 2, py: 1, width: "100%" }}>
        <Box sx={{ alignItems: "center", display: "flex", pl: 1, pr: 0.5 }}>
          <Box sx={{ flex: 1, minWidth: 0, py: 1 }}>
            <RouteDisplayBanner
              routeColor={route.routeColor}
              routeId={route.routeId}
              routeName={routeDisplayName(route)}
            />
          </Box>
          <AddToFavorites compact={true} value={route} />
          <ShareButton compact={true} />
        </Box>
        <Box sx={{ px: 2 }}>
          <DirectionToggle
            directionId={Number(directionId)}
            distinctTrips={distinctTrips}
            route={route}
            setDirection={setDirection}
          />
        </Box>
      </Box>
      <RouteNextBus
        directionId={
          Number.isFinite(Number(directionId)) ? Number(directionId) : 0
        }
        key={`${route.routeId}:${directionId}`}
        routeId={route.routeId}
        stops={stops}
      />
      <Divider sx={{ mt: 1 }} />
      <ListItemButton
        aria-controls={"route-all-stops"}
        aria-expanded={showAllStops}
        onClick={() => setShowAllStops((shown) => !shown)}
      >
        <ListItemText
          primary={`All ${stops.length} stops`}
          secondary={"Times and buses along the route"}
        />
        {showAllStops ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItemButton>
      {/* Stays in the page (not unmounted) so it's still there for search engines */}
      <Collapse id={"route-all-stops"} in={showAllStops}>
        <RouteStopsTimeline live={showAllStops} route={route} stops={stops} />
      </Collapse>
    </MenuPanel>
  );
};
