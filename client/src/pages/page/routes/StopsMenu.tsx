import { Outlet, useMatches, useNavigate } from "react-router-dom";
import {
  HandleType,
  stopLoader,
  stopsLoader,
  useDataFromLoader,
} from "../../../App";
import * as React from "react";
import { StopsSearchPanel } from "../../../components/StopsSearchPanel";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";

export const StopsMenu = () => {
  const navigate = useNavigate();
  const stopsData = useDataFromLoader(stopsLoader);
  const { viewStatePathname } = useViewStatePathname();
  const matches = useMatches();
  const stop = matches
    .filter((match) => Boolean((match.handle as HandleType)?.stop))
    .map((match) =>
      (match.handle as HandleType)?.stop?.(
        match.data as Awaited<ReturnType<typeof stopLoader>>
      )
    )[0];

  return (
    <>
      <StopsSearchPanel
        stops={stopsData?.stopsByName?.data.stopsByName || []}
        setStop={(stop) => {
          if (stop) {
            navigate(`${viewStatePathname}/stops/${stop.stopId}`);
          }
        }}
        stop={stop}
      />
      <Outlet />
    </>
  );
};
