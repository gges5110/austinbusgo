import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { graphQLEndpoint } from "config/config";
import * as Types from "shared/types/interface.d";

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
  stopName: Types.Scalars["String"]["input"];
}>;

export type StopsByNameQuery = {
  __typename?: "Query";
  stopsByName: Array<{
    __typename?: "Stop";
    stopId: string;
    stopCode?: string | null;
    stopName?: string | null;
    stopLoc?: {
      __typename?: "Point";
      type: Types.GeometryType;
      coordinates: Array<number>;
    } | null;
  }>;
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
) => {
  return useQuery<StopsByNameQuery, TError, TData>(
    ["StopsByName", variables],
    fetcher<StopsByNameQuery, StopsByNameQueryVariables>(
      StopsByNameDocument,
      variables
    ),
    options
  );
};

useStopsByNameQuery.getKey = (variables: StopsByNameQueryVariables) => [
  "StopsByName",
  variables,
];

useStopsByNameQuery.fetcher = (variables: StopsByNameQueryVariables) =>
  fetcher<StopsByNameQuery, StopsByNameQueryVariables>(
    StopsByNameDocument,
    variables
  );
