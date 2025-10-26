import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import RouteIcon from "@mui/icons-material/Route";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";
import {
  isRoute,
  isSearchTerm,
  isStop,
} from "features/search/components/SearchPanel/hooks/searchPanelUtils";
import { useSetAtom } from "jotai";
import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import { useTitle } from "shared/hooks/UseTitle";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { hoveringStopAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

export const RecentSearchesMenu = () => {
  const { recentSearches, removeFromRecentSearches } = useRecentSearches();
  const { viewStatePathname } = useViewStatePathname();
  const setHoveringStop = useSetAtom(hoveringStopAtom);

  useTitle("Recent Searches - Austin Bus Go");

  const handleRemove = (
    e: React.MouseEvent,
    search: typeof recentSearches[0]
  ) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromRecentSearches(search.value);
  };

  return (
    <MenuPanel>
      <Container sx={{ p: 2 }}>
        <Box display={"flex"} alignItems={"center"} gap={1}>
          <AccessTimeIcon />
          <Typography variant={"h6"}>Recent Searches</Typography>
        </Box>
      </Container>

      {recentSearches.length === 0 ? (
        <Container sx={{ p: 2 }}>
          <Typography color={"gray"} fontSize={14}>
            No recent searches yet. Start searching for routes, stops, or
            locations!
          </Typography>
        </Container>
      ) : (
        <List>
          {recentSearches.map((search, index) => {
            const { value } = search;

            if (isStop(value)) {
              return (
                <React.Fragment key={`recent-stop-${value.stopId}-${index}`}>
                  <ListItem
                    disablePadding={true}
                    secondaryAction={
                      <IconButton
                        aria-label={"Remove from recent searches"}
                        edge={"end"}
                        onClick={(e) => handleRemove(e, search)}
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      component={RouterLink}
                      onMouseEnter={() => {
                        setHoveringStop(value as Stop);
                      }}
                      onMouseLeave={() => {
                        setHoveringStop(undefined);
                      }}
                      sx={{ py: 2 }}
                      to={`/stop/${value.stopId}${viewStatePathname}`}
                    >
                      <Box display={"flex"} flexDirection={"column"} gap={1}>
                        <Box display={"flex"} gap={1}>
                          <PlaceOutlinedIcon />
                          <Typography fontWeight={"bold"}>
                            {value.stopName}
                          </Typography>
                        </Box>

                        <Typography color={"gray"} fontSize={14}>
                          {"Stop Code: "}
                          {value.stopId}
                        </Typography>

                        <Box display={"flex"} flexWrap={"wrap"} gap={1}>
                          {value?.routes?.map((route) => (
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
              );
            } else if (isRoute(value)) {
              return (
                <React.Fragment key={`recent-route-${value.routeId}-${index}`}>
                  <ListItem
                    disablePadding={true}
                    secondaryAction={
                      <IconButton
                        aria-label={"Remove from recent searches"}
                        edge={"end"}
                        onClick={(e) => handleRemove(e, search)}
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      component={RouterLink}
                      to={`/route/${value.routeId}/direction/0${viewStatePathname}`}
                    >
                      <Box display={"flex"} gap={1}>
                        <RouteIcon />
                        <RouteIdDisplay
                          routeColor={value.routeColor}
                          routeId={value.routeId}
                        />
                        {value.routeLongName}
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              );
            } else if (isSearchTerm(value)) {
              return (
                <React.Fragment key={`recent-search-${value.value}-${index}`}>
                  <ListItem
                    disablePadding={true}
                    secondaryAction={
                      <IconButton
                        aria-label={"Remove from recent searches"}
                        edge={"end"}
                        onClick={(e) => handleRemove(e, search)}
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      component={RouterLink}
                      to={`/search/${encodeURIComponent(
                        value.value
                      )}${viewStatePathname}`}
                    >
                      <Box display={"flex"} gap={1} alignItems={"center"}>
                        <SearchIcon />
                        <Typography>{value.value}</Typography>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              );
            }

            return null;
          })}
        </List>
      )}
    </MenuPanel>
  );
};
