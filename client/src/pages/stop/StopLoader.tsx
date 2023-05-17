import {
  StopQuery,
  StopQueryVariables,
  useStopQuery,
} from "../../schemas/Stop.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "../../QueryClient";

const stopQuery = (id: StopQueryVariables) => ({
  queryKey: useStopQuery.getKey(id),
  queryFn: useStopQuery.fetcher(id),
});
export const stopLoader = async ({ params }: LoaderFunctionArgs) => {
  const stopId = params["stopId"];

  return queryClient.ensureQueryData<StopQuery>(
    stopQuery({
      stopId: stopId || "0",
    })
  );
};
