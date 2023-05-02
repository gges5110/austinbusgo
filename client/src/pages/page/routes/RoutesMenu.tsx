import { Outlet, useMatches, useNavigate } from "react-router-dom";
import {
  HandleType,
  routeLoader,
  routesLoader,
  useDataFromLoader,
} from "../../../App";
import { SearchPanel } from "../../../components/SearchPanel";
import * as React from "react";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";
import { Params } from "@remix-run/router";

export const RoutesMenu = () => {
  const navigate = useNavigate();
  const {
    data: { routes },
  } = useDataFromLoader(routesLoader);
  const matches = useMatches() as {
    id: string;
    pathname: string;
    params: Params;
    data: unknown;
    handle: HandleType;
  }[];

  const route = matches
    .filter((match) => Boolean(match.handle?.route))
    .map((match) =>
      match.handle?.route?.(
        match.data as Awaited<ReturnType<typeof routeLoader>>
      )
    )[0];
  const { viewStatePathname } = useViewStatePathname();

  return (
    <>
      <SearchPanel
        routes={routes || []}
        setRoute={(route) => {
          if (route) {
            navigate(
              `${viewStatePathname}/routes/${route?.routeId}/direction/0`
            );
          }
        }}
        route={route}
      />
      <Outlet />
    </>
  );
};
