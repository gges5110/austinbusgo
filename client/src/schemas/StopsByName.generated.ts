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
export type StopsByNameQueryVariables = Types.Exact<{
  stopName: Types.Scalars["String"];
}>;

export type StopsByNameQuery = { __typename?: "Query" } & {
  stopsByName?: Types.Maybe<
    Array<
      { __typename?: "Stop" } & Pick<
        Types.Stop,
        "stopId" | "stopCode" | "stopName"
      > & {
          stopLoc?: Types.Maybe<
            { __typename?: "Point" } & Pick<Types.Point, "type" | "coordinates">
          >;
        }
    >
  >;
};

export const StopsByNameDocument = `
    query StopsByName($stopName: String!) {
  stopsByName(stopName: $stopName) {
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
export const useStopsByNameQuery = <TData = StopsByNameQuery, TError = unknown>(
  variables: StopsByNameQueryVariables,
  options?: UseQueryOptions<StopsByNameQuery, TError, TData>
) =>
  useQuery<StopsByNameQuery, TError, TData>(
    ["StopsByName", variables],
    fetcher<StopsByNameQuery, StopsByNameQueryVariables>(
      StopsByNameDocument,
      variables
    ),
    options
  );

useStopsByNameQuery.getKey = (variables: StopsByNameQueryVariables) => [
  "StopsByName",
  variables,
];
useStopsByNameQuery.fetcher = (variables: StopsByNameQueryVariables) =>
  fetcher<StopsByNameQuery, StopsByNameQueryVariables>(
    StopsByNameDocument,
    variables
  );
