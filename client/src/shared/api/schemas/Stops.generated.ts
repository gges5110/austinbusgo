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
export type StopsQueryVariables = Types.Exact<{ [key: string]: never }>;

export type StopsQuery = {
  __typename?: "Query";
  stops: Array<{
    __typename?: "Stop";
    stopId: string;
    stopCode?: string | null;
    stopName?: string | null;
    stopLoc?: {
      __typename?: "Point";
      type: string;
      coordinates: Array<number>;
    } | null;
  }>;
};

export const StopsDocument = `
    query Stops {
  stops {
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

export const useStopsQuery = <TData = StopsQuery, TError = unknown>(
  variables?: StopsQueryVariables,
  options?: UseQueryOptions<StopsQuery, TError, TData>
) => {
  return useQuery<StopsQuery, TError, TData>(
    variables === undefined ? ["Stops"] : ["Stops", variables],
    fetcher<StopsQuery, StopsQueryVariables>(StopsDocument, variables),
    options
  );
};

useStopsQuery.getKey = (variables?: StopsQueryVariables) =>
  variables === undefined ? ["Stops"] : ["Stops", variables];

useStopsQuery.fetcher = (variables?: StopsQueryVariables) =>
  fetcher<StopsQuery, StopsQueryVariables>(StopsDocument, variables);
