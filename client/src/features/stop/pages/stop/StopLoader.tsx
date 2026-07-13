import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "app/QueryClient";
import { getStopQueryOptions } from "shared/api/generated/api";

export const stopLoader = async ({ params }: LoaderFunctionArgs) => {
  const stopId = params["stopId"];

  return queryClient.ensureQueryData(getStopQueryOptions(stopId || "0"));
};
