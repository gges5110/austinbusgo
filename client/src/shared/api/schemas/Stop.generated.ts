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
export type StopQueryVariables = Types.Exact<{
  stopId: Types.Scalars["String"]["input"];
}>;

export type StopQuery = {
  __typename?: "Query";
  stop: {
    __typename?: "Stop";
    stopId: string;
    stopCode?: string | null;
    stopName?: string | null;
    stopLoc?: {
      __typename?: "Point";
      type: Types.GeometryType;
      coordinates: Array<number>;
    } | null;
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
) => {
  return useQuery<StopQuery, TError, TData>(
    ["Stop", variables],
    fetcher<StopQuery, StopQueryVariables>(StopDocument, variables),
    options
  );
};

useStopQuery.getKey = (variables: StopQueryVariables) => ["Stop", variables];

useStopQuery.fetcher = (variables: StopQueryVariables) =>
  fetcher<StopQuery, StopQueryVariables>(StopDocument, variables);
