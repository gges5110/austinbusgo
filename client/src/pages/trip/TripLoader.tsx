import {
  TripQuery,
  TripQueryVariables,
  useTripQuery,
} from "../../schemas/Trip.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "../../QueryClient";
import {
  StopTimesQuery,
  StopTimesQueryVariables,
  useStopTimesQuery,
} from "../../schemas/StopTimes.generated";
import {
  TripUpdateQuery,
  TripUpdateQueryVariables,
  useTripUpdateQuery,
} from "../../schemas/TripUpdate.generated";

const tripQuery = (id: TripQueryVariables) => ({
  queryKey: useTripQuery.getKey(id),
  queryFn: useTripQuery.fetcher(id),
});
const stopTimesQuery = (id: StopTimesQueryVariables) => ({
  queryKey: useStopTimesQuery.getKey(id),
  queryFn: useStopTimesQuery.fetcher(id),
});

const tripUpdateQuery = (id: TripUpdateQueryVariables) => ({
  queryKey: useTripUpdateQuery.getKey(id),
  queryFn: useTripUpdateQuery.fetcher(id),
});

export const tripLoader = async ({ params }: LoaderFunctionArgs) => {
  const tripId = params["tripId"];
  const id = {
    tripId: tripId || "",
  };
  const tripDataQuery = queryClient.ensureQueryData<TripQuery>(tripQuery(id));
  const tripUpdateDataQuery = queryClient.ensureQueryData<TripUpdateQuery>(
    tripUpdateQuery(id)
  );
  const stopTimesDataQuery = queryClient.ensureQueryData<StopTimesQuery>(
    stopTimesQuery(id)
  );

  const tripData = await tripDataQuery;
  const tripUpdateData = await tripUpdateDataQuery;
  const stopTimesData = await stopTimesDataQuery;

  return {
    trip: tripData.trip,
    stopTimes: stopTimesData.stopTimes,
    tripUpdate: tripUpdateData.tripUpdate,
  };
};
