import {
  StopQuery,
  StopQueryVariables,
  useStopQuery,
} from "../../../../shared/api/schemas/Stop.generated";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import { queryClient } from "../../../../app/QueryClient";

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
