import * as Types from "../interfaces/interface.d";

import { graphQLEndpoint } from "../config";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

function fetcher<TData, TVariables>(query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(graphQLEndpoint as string, {
      method: "POST",
      ...{ headers: { "Content-Type": "application/json" } },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  };
}
export type StopTimesQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"];
}>;

export type StopTimesQuery = { __typename?: "Query" } & {
  stopTimes: Array<
    { __typename?: "StopTimes" } & Pick<
      Types.StopTimes,
      "tripId" | "arrivalTime" | "departureTime" | "stopId" | "stopSequence"
    > & { stop: { __typename?: "Stop" } & Pick<Types.Stop, "stopName"> }
  >;
};

export const StopTimesDocument = `
    query StopTimes($tripId: String!) {
  stopTimes(tripId: $tripId) {
    tripId
    arrivalTime
    departureTime
    stopId
    stopSequence
    stop {
      stopName
    }
  }
}
    `;
export const useStopTimesQuery = <TData = StopTimesQuery, TError = unknown>(
  variables: StopTimesQueryVariables,
  options?: UseQueryOptions<StopTimesQuery, TError, TData>
) =>
  useQuery<StopTimesQuery, TError, TData>(
    ["StopTimes", variables],
    fetcher<StopTimesQuery, StopTimesQueryVariables>(
      StopTimesDocument,
      variables
    ),
    options
  );

useStopTimesQuery.getKey = (variables: StopTimesQueryVariables) => [
  "StopTimes",
  variables,
];
useStopTimesQuery.fetcher = (variables: StopTimesQueryVariables) =>
  fetcher<StopTimesQuery, StopTimesQueryVariables>(
    StopTimesDocument,
    variables
  );
