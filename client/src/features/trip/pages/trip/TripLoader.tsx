import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "app/QueryClient";
import {
  getStopTimesQueryOptions,
  getTripQueryOptions,
  getTripUpdateQueryOptions,
} from "shared/api/generated/api";

export const tripLoader = async ({ params }: LoaderFunctionArgs) => {
  const tripId = params["tripId"] || "";
  const tripDataQuery = queryClient.ensureQueryData(
    getTripQueryOptions(tripId)
  );
  const tripUpdateDataQuery = queryClient.ensureQueryData(
    getTripUpdateQueryOptions(tripId)
  );
  const stopTimesDataQuery = queryClient.ensureQueryData(
    getStopTimesQueryOptions(tripId)
  );

  return {
    trip: await tripDataQuery,
    stopTimes: await stopTimesDataQuery,
    tripUpdate: await tripUpdateDataQuery,
  };
};
