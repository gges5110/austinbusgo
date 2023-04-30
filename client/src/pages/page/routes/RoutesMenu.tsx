import { Outlet, useNavigate } from "react-router-dom";
import {
  routeLoader,
  routesLoader,
  useDataFromLoader,
  useDataFromRouteLoader,
} from "../../../App";
import { SearchPanel } from "../../../components/SearchPanel";
import * as React from "react";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";

export const RoutesMenu = () => {
  const navigate = useNavigate();
  const {
    data: { routes },
  } = useDataFromLoader(routesLoader);
  const routeLoaderData = useDataFromRouteLoader("route", routeLoader);
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
        route={routeLoaderData?.route}
      />
      <Outlet />
    </>
  );
};
