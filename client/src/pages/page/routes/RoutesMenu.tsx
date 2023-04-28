import { useNavigate } from "react-router-dom";
import { routesLoader, useDataFromLoader } from "../../../App";
import { SearchPanel } from "../../../components/SearchPanel";
import * as React from "react";

export const RoutesMenu = () => {
  const navigate = useNavigate();
  const {
    data: { routes },
  } = useDataFromLoader(routesLoader);

  return (
    <SearchPanel
      routes={routes || []}
      setRoute={(trip) => {
        if (trip) {
          navigate(`/routes/${trip?.routeId}/direction/0`);
        }
      }}
      route={undefined}
      loading={false}
      routeLoading={false}
    />
  );
};
