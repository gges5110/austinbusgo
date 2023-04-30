import { Outlet, useNavigate } from "react-router-dom";
import {
  stopLoader,
  stopsLoader,
  useDataFromLoader,
  useDataFromRouteLoader,
} from "../../../App";
import * as React from "react";
import { StopsSearchPanel } from "../../../components/StopsSearchPanel";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";

export const StopsMenu = () => {
  const navigate = useNavigate();
  const stopsData = useDataFromLoader(stopsLoader);
  const stopLoaderData = useDataFromRouteLoader("stop", stopLoader);
  const { viewStatePathname } = useViewStatePathname();

  return (
    <>
      <StopsSearchPanel
        stops={stopsData?.stopsByName?.data.stopsByName || []}
        setStop={(stop) => {
          if (stop) {
            navigate(`${viewStatePathname}/stops/${stop.stopId}`);
          }
        }}
        stop={stopLoaderData?.data.stop}
      />
      <Outlet />
    </>
  );
};
