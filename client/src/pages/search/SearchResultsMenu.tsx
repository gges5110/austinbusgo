import { MenuPanel } from "../../components/MenuPanel";
import * as React from "react";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  SearchDocument,
  SearchQuery,
  SearchQueryVariables,
} from "../../schemas/Search.generated";
import { client, useDataFromLoader } from "../../Router";
import {
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
import { useEffect } from "react";

export const searchLoader = async ({ params }: LoaderFunctionArgs) => {
  const searchTerm = decodeURIComponent(params["searchTerm"] || "");
  return await client.query<SearchQuery, SearchQueryVariables>({
    query: SearchDocument,
    variables: {
      searchTerm: searchTerm || "",
    },
  });
};
export const SearchResultsMenu = () => {
  const { data } = useDataFromLoader(searchLoader);
  const { searchTerm } = useParams();
  const { viewStatePathname } = useViewStatePathname();
  const navigate = useNavigate();
  const length = data.search.stops.length + data.search.routes.length;
  const noResults = length === 0;
  useEffect(() => {
    if (length === 1) {
      if (data.search.stops.length) {
        navigate(`${viewStatePathname}/stop/${data.search.stops[0].stopId}`, {
          replace: true,
        });
      } else if (data.search.routes.length) {
        navigate(
          `${viewStatePathname}/route/${data.search.routes[0].routeId}/direction/0`,
          { replace: true }
        );
      }
    }
  }, []);

  return (
    <MenuPanel>
      {!noResults ? (
        <List>
          {data.search.stops.map((stop) => {
            return (
              <>
                <ListItem disablePadding key={stop.stopId}>
                  <ListItemButton
                    component={RouterLink}
                    to={`${viewStatePathname}/stop/${stop.stopId}`}
                  >
                    <PlaceOutlinedIcon />
                    {stop.stopId} {stop.stopName}
                  </ListItemButton>
                </ListItem>
                <Divider />
              </>
            );
          })}
          {data.search.routes.map((route) => {
            return (
              <>
                <ListItem disablePadding key={route.routeId}>
                  <ListItemButton
                    component={RouterLink}
                    to={`${viewStatePathname}/route/${route.routeId}/direction/0`}
                  >
                    <RouteIcon />
                    <RouteIdDisplay
                      routeColor={route.routeColor}
                      routeId={route.routeId}
                    />
                    {route.routeLongName}
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
          <Typography>Austin Bus Go can&apos;t find {searchTerm}</Typography>
          <Typography color={"gray"} fontSize={14}>
            Make sure your search is spelled correctly. Try adding a route
            number, street name, or stop code.
          </Typography>
        </Container>
      )}
    </MenuPanel>
  );
};
