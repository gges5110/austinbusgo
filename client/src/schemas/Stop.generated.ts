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
export type StopQueryVariables = Types.Exact<{
  stopId: Types.Scalars["String"];
}>;

export type StopQuery = { __typename?: "Query" } & {
  stop: { __typename?: "Stop" } & Pick<
    Types.Stop,
    "stopId" | "stopCode" | "stopName"
  > & {
      stopLoc?: Types.Maybe<
        { __typename?: "Point" } & Pick<Types.Point, "type" | "coordinates">
      >;
    };
};

export const StopDocument = `
    query Stop($stopId: String!) {
  stop(stopId: $stopId) {
    stopId
    stopCode
    stopName
    stopLoc {
      type
      coordinates
    }
  }
}
    `;
export const useStopQuery = <TData = StopQuery, TError = unknown>(
  variables: StopQueryVariables,
  options?: UseQueryOptions<StopQuery, TError, TData>
) =>
  useQuery<StopQuery, TError, TData>(
    ["Stop", variables],
    fetcher<StopQuery, StopQueryVariables>(StopDocument, variables),
    options
  );

useStopQuery.getKey = (variables: StopQueryVariables) => ["Stop", variables];
useStopQuery.fetcher = (variables: StopQueryVariables) =>
  fetcher<StopQuery, StopQueryVariables>(StopDocument, variables);
