import { Outlet, useNavigate } from "react-router-dom";
import {
  routeLoader,
  routesLoader,
  useDataFromLoader,
  useDataFromRouteLoader,
} from "../../../App";
import { SearchPanel } from "../../../components/SearchPanel";
import * as React from "react";

export const RoutesMenu = () => {
  const navigate = useNavigate();
  const {
    data: { routes },
  } = useDataFromLoader(routesLoader);
  const routeLoaderData = useDataFromRouteLoader("route", routeLoader);

  return (
    <>
      <SearchPanel
        routes={routes || []}
        setRoute={(route) => {
          if (route) {
            navigate(
              `/@30.3116707,-97.7385137,12.89z/routes/${route?.routeId}/direction/0`
            );
          }
        }}
        route={routeLoaderData?.route}
      />
      <Outlet />
    </>
  );
};
