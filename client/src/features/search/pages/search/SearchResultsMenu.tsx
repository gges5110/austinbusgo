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
import { useDataFromLoader } from "app/Router";
import { useSetAtom } from "jotai";
import * as React from "react";
import { useEffect } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { SearchQuery } from "shared/api/schemas/Search.generated";
import { MenuPanel } from "shared/components/MenuPanel/MenuPanel";
import { RouteIdDisplay } from "shared/components/RouteIdDisplay/RouteIdDisplay";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import { useTitle } from "shared/hooks/UseTitle";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { hoveringStopAtom } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

import { searchLoader } from "./SearchLoader";

export const isResponse = (data: Response | SearchQuery): data is Response => {
  return data !== undefined && "ok" in data;
};

export const SearchResultsMenu = () => {
  const searchData = useDataFromLoader(searchLoader);
  const { searchTerm } = useParams();
  const { viewStatePathname } = useViewStatePathname();

  const { addToRecentSearches } = useRecentSearches();
  useTitle(`${searchTerm} - Austin Bus Go`);

  if (isResponse(searchData)) {
    return null;
  }

  const length =
    searchData.search.stops.length + searchData.search.routes.length;
  const noResults = length === 0;
  useEffect(() => {
    if (searchTerm && !noResults) {
      addToRecentSearches({ value: searchTerm });
    }
  }, [searchTerm, noResults]);

  const setHoveringStop = useSetAtom(hoveringStopAtom);

  return (
    <MenuPanel>
      {noResults && (
        <Container
          sx={{ p: 2, display: "flex", gap: 1, flexDirection: "column" }}
        >
          <Box component={"span"} display={"inherit"}>
            <Typography mr={"4px"}>Austin Bus Go can&apos;t find</Typography>
            <Typography fontStyle={"italic"}>{searchTerm}</Typography>
          </Box>

          <Typography color={"gray"} fontSize={14}>
            Make sure your search is spelled correctly. Try adding a route
            number, street name, or stop code.
          </Typography>
        </Container>
      )}

      {!noResults && (
        <List>
          {searchData.search.stops.map((stop) => {
            return (
              <>
                <ListItem disablePadding={true} key={`stop-${stop.stopId}`}>
                  <ListItemButton
                    component={RouterLink}
                    onClick={() => {
                      addToRecentSearches(stop);
                    }}
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
              </>
            );
          })}
          {searchData.search.routes.map((route) => {
            return (
              <>
                <ListItem disablePadding={true} key={`route-${route.routeId}`}>
                  <ListItemButton
                    component={RouterLink}
                    onClick={() => {
                      addToRecentSearches(route);
                    }}
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
              </>
            );
          })}
        </List>
      )}
    </MenuPanel>
  );
};
