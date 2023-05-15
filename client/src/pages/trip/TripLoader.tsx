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

const tripQuery = (id: TripQueryVariables) => ({
  queryKey: useTripQuery.getKey(id),
  queryFn: useTripQuery.fetcher(id),
});
const stopTimesQuery = (id: StopTimesQueryVariables) => ({
  queryKey: useStopTimesQuery.getKey(id),
  queryFn: useStopTimesQuery.fetcher(id),
});
export const tripLoader = async ({ params }: LoaderFunctionArgs) => {
  const tripId = params["tripId"];
  const id = {
    tripId: tripId || "",
  };
  const tripData = await queryClient.ensureQueryData<TripQuery>(tripQuery(id));
  const stopTimesData = await queryClient.ensureQueryData<StopTimesQuery>(
    stopTimesQuery(id)
  );

  return {
    trip: tripData.trip,
    stopTimes: stopTimesData.stopTimes,
  };
};
