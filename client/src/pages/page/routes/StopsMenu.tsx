import { Outlet, useNavigate } from "react-router-dom";
import {
  stopLoader,
  stopsLoader,
  useDataFromLoader,
  useDataFromRouteLoader,
} from "../../../App";
import * as React from "react";
import { StopsSearchPanel } from "../../../components/StopsSearchPanel";

export const StopsMenu = () => {
  const navigate = useNavigate();
  const stopsData = useDataFromLoader(stopsLoader);
  const stopLoaderData = useDataFromRouteLoader("stop", stopLoader);

  return (
    <>
      <StopsSearchPanel
        stops={stopsData?.stopsByName?.data.stopsByName || []}
        setStop={(stop) => {
          if (stop) {
            navigate(`/@30.3116707,-97.7385137,12.89z/stops/${stop.stopId}`);
          }
        }}
        searchString={stopsData.q || ""}
        stop={stopLoaderData?.data.stop}
      />
      <Outlet />
    </>
  );
};
