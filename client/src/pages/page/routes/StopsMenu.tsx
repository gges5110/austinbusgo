import { Outlet, useMatches, useNavigate } from "react-router-dom";
import * as React from "react";
import { StopsSearchPanel } from "../../../components/Stop/StopsSearchPanel";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";
import { client, HandleType, useDataFromLoader } from "../../../Router";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  StopsByNameDocument,
  StopsByNameQuery,
  StopsByNameQueryVariables,
} from "../../../schemas/StopsByName.generated";
import { stopLoader } from "./route/stop/StopMenu";

export const stopsLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  let stopsByName = undefined;
  if (q) {
    stopsByName = await client.query<
      StopsByNameQuery,
      StopsByNameQueryVariables
    >({
      query: StopsByNameDocument,
      variables: {
        stopName: q,
      },
    });
  }

  return {
    stopsByName,
    q,
  };
};
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
