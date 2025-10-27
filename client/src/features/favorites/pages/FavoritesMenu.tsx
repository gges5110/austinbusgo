import BookmarkIcon from "@mui/icons-material/Bookmark";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteIcon from "@mui/icons-material/Route";
import {
  Box,
  Container,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";
import {
  isRoute,
  isStop,
} from "features/search/components/SearchPanel/hooks/searchPanelUtils";
import { useSetAtom } from "jotai";
import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import { useFavorites } from "shared/components/AddToFavorites/useFavorites";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";
import { useTitle } from "shared/hooks/UseTitle";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { hoveringStopAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

export const FavoritesMenu = () => {
  const { favorites } = useFavorites();
  const { viewStatePathname } = useViewStatePathname();
  const setHoveringStop = useSetAtom(hoveringStopAtom);

  useTitle("Favorites - Austin Bus Go");

  const favoriteStops = favorites.filter(isStop);
  const favoriteRoutes = favorites.filter(isRoute);
  const hasFavorites = favorites.length > 0;

  return (
    <MenuPanel>
      <Container sx={{ p: 2 }}>
        <Box alignItems={"center"} display={"flex"} gap={1}>
          <BookmarkIcon />
          <Typography variant={"h6"}>Favorites</Typography>
        </Box>
      </Container>

      {!hasFavorites && (
        <Container sx={{ p: 2 }}>
          <Typography>Start adding favorites!</Typography>
          <Typography color={"gray"} fontSize={14}>
            You can add routes or stops to favorites by clicking the bookmark
            button on their detail pages.
          </Typography>
        </Container>
      )}

      {hasFavorites && (
        <List>
          {favoriteStops.map((stop) => (
            <React.Fragment key={`favorite-stop-${stop.stopId}`}>
              <ListItem disablePadding={true}>
                <ListItemButton
                  component={RouterLink}
                  onMouseEnter={() => {
                    setHoveringStop(stop as Stop);
                  }}
                  onMouseLeave={() => {
                    setHoveringStop(undefined);
                  }}
                  sx={{ py: 2 }}
                  to={`/stop/${stop.stopId}${viewStatePathname}`}
                >
                  <Box display={"flex"} flexDirection={"column"} gap={1}>
                    <Box display={"flex"} gap={1}>
                      <PlaceOutlinedIcon />
                      <Typography fontWeight={"bold"}>
                        {stop.stopName}
                      </Typography>
                    </Box>

                    <Typography color={"gray"} fontSize={14}>
                      {"Stop Code: "}
                      {stop.stopId}
                    </Typography>

                    <Box display={"flex"} flexWrap={"wrap"} gap={1}>
                      {stop?.routes?.map((route) => (
                        <RouteIdDisplay
                          key={route.routeId}
                          routeColor={route.routeColor}
                          routeId={route.routeId}
                        />
                      ))}
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
          {favoriteRoutes.map((route) => (
            <React.Fragment key={`favorite-route-${route.routeId}`}>
              <ListItem disablePadding={true}>
                <ListItemButton
                  component={RouterLink}
                  to={`/route/${route.routeId}/direction/0${viewStatePathname}`}
                >
                  <Box display={"flex"} gap={1}>
                    <RouteIcon />
                    <RouteIdDisplay
                      routeColor={route.routeColor}
                      routeId={route.routeId}
                    />
                    {route.routeLongName}
                  </Box>
                </ListItemButton>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}
    </MenuPanel>
  );
};
