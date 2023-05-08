import { MenuPanel } from "../../components/MenuPanel";
import * as React from "react";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  SearchDocument,
  SearchQuery,
  SearchQueryVariables,
} from "../../schemas/Search.generated";
import { client, useDataFromLoader } from "../../Router";
import { Divider, List, ListItem, ListItemButton } from "@mui/material";
import { RouteIdDisplay } from "../../components/RouteIdDisplay/RouteIdDisplay";
import { useNavigate } from "react-router-dom";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import RouteIcon from "@mui/icons-material/Route";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

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
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();
  return (
    <MenuPanel>
      <List>
        {data.search.stops.map((stop) => {
          return (
            <>
              <ListItem disablePadding key={stop.stopId}>
                <ListItemButton
                  onClick={() => {
                    navigate(`${viewStatePathname}/stops/${stop.stopId}`);
                  }}
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
                  onClick={() => {
                    navigate(
                      `${viewStatePathname}/routes/${route.routeId}/direction/0`
                    );
                  }}
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
    </MenuPanel>
  );
};
