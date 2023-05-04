import { Outlet, useMatches, useNavigate } from "react-router-dom";
import { SearchPanel } from "../../components/Route/SearchPanel";
import * as React from "react";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import { Params } from "@remix-run/router";
import { client, HandleType, useDataFromLoader } from "../../Router";
import { RoutesDocument, RoutesQuery } from "../../schemas/Routes.generated";
import { routeLoader } from "./route/RouteMenu";
import { stopLoader } from "./stop/StopMenu";

export const routesLoader = async () => {
  return await client.query<RoutesQuery>({ query: RoutesDocument });
};
export const RootSearchMenu = () => {
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
  const stop = matches
    .filter((match) => Boolean((match.handle as HandleType)?.stop))
    .map((match) =>
      (match.handle as HandleType)?.stop?.(
        match.data as Awaited<ReturnType<typeof stopLoader>>
      )
    )[0];
  const { viewStatePathname } = useViewStatePathname();

  return (
    <>
      <SearchPanel
        routes={routes || []}
        route={route}
        setRoute={(route) => {
          if (route) {
            navigate(
              `${viewStatePathname}/routes/${route?.routeId}/direction/0`
            );
          }
        }}
        stop={stop}
        setStop={(stop) => {
          if (stop) {
            navigate(`${viewStatePathname}/stops/${stop.stopId}`);
          }
        }}
      />
      <Outlet />
    </>
  );
};
