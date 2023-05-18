import { MenuPanel } from "../../components/MenuPanel";
import * as React from "react";
import { useEffect } from "react";
import { useDataFromLoader } from "../../Router";
import {
  Box,
  Container,
  Divider,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";
import { RouteIdDisplay } from "../../components/RouteIdDisplay/RouteIdDisplay";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import RouteIcon from "@mui/icons-material/Route";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { searchLoader } from "./SearchLoader";
import { useRecentSearches } from "../../hooks/UseRecentSearches";
import { useSetAtom } from "jotai";
import { hoveringStopAtom } from "../../Atoms";
import { Stop } from "../../interfaces/interface.d";
import { useTitle } from "../../hooks/UseTitle";

export const SearchResultsMenu = () => {
  const searchData = useDataFromLoader(searchLoader);
  const { searchTerm } = useParams();
  const { viewStatePathname } = useViewStatePathname();
  const navigate = useNavigate();
  const length =
    searchData.search.stops.length + searchData.search.routes.length;
  const noResults = length === 0;
  useEffect(() => {
    if (length === 1) {
      if (searchData.search.stops.length) {
        navigate(
          `${viewStatePathname}/stop/${searchData.search.stops[0].stopId}`,
          {
            replace: true,
          }
        );
      } else if (searchData.search.routes.length) {
        navigate(
          `${viewStatePathname}/route/${searchData.search.routes[0].routeId}/direction/0`,
          { replace: true }
        );
      }
    }
  }, []);
  const { addToRecentSearches } = useRecentSearches();
  useTitle(`${searchTerm} - Austin Bus Go`);

  const setHoveringStop = useSetAtom(hoveringStopAtom);
  return (
    <MenuPanel>
      {!noResults ? (
        <List>
          {searchData.search.stops.map((stop) => {
            return (
              <>
                <ListItem disablePadding key={`stop-${stop.stopId}`}>
                  <ListItemButton
                    sx={{ py: 2 }}
                    component={RouterLink}
                    to={`${viewStatePathname}/stop/${stop.stopId}`}
                    onClick={() => {
                      addToRecentSearches(stop);
                    }}
                    onMouseEnter={() => {
                      setHoveringStop(stop as Stop);
                    }}
                    onMouseLeave={() => {
                      setHoveringStop(undefined);
                    }}
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

                      <Box display={"flex"} gap={1} flexWrap={"wrap"}>
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
                <ListItem disablePadding key={`route-${route.routeId}`}>
                  <ListItemButton
                    component={RouterLink}
                    to={`${viewStatePathname}/route/${route.routeId}/direction/0`}
                    onClick={() => {
                      addToRecentSearches(route);
                    }}
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
      ) : (
        <Container
          sx={{ p: 2, display: "flex", gap: 1, flexDirection: "column" }}
        >
          <Typography>
            {"Austin Bus Go can&apos;t find "}
            {searchTerm}
          </Typography>
          <Typography color={"gray"} fontSize={14}>
            Make sure your search is spelled correctly. Try adding a route
            number, street name, or stop code.
          </Typography>
        </Container>
      )}
    </MenuPanel>
  );
};
