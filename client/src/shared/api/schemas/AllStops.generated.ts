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
export type AllStopsQueryVariables = Types.Exact<{ [key: string]: never }>;

export type AllStopsQuery = {
  __typename?: "Query";
  stops: Array<{
    __typename?: "Stop";
    stopId: string;
    stopCode?: string | null;
    stopName?: string | null;
    stopLoc?: {
      __typename?: "Point";
      type: Types.GeometryType;
      coordinates: Array<number>;
    } | null;
    routes: Array<{
      __typename?: "Route";
      routeId: string;
      routeColor?: string | null;
      routeLongName: string;
    }>;
  }>;
};

export const AllStopsDocument = `
    query AllStops {
  stops {
    stopId
    stopCode
    stopName
    stopLoc {
      type
      coordinates
    }
    routes {
      routeId
      routeColor
      routeLongName
    }
  }
}
    `;

export const useAllStopsQuery = <TData = AllStopsQuery, TError = unknown>(
  variables?: AllStopsQueryVariables,
  options?: UseQueryOptions<AllStopsQuery, TError, TData>
) => {
  return useQuery<AllStopsQuery, TError, TData>(
    variables === undefined ? ["AllStops"] : ["AllStops", variables],
    fetcher<AllStopsQuery, AllStopsQueryVariables>(AllStopsDocument, variables),
    options
  );
};

useAllStopsQuery.getKey = (variables?: AllStopsQueryVariables) =>
  variables === undefined ? ["AllStops"] : ["AllStops", variables];

useAllStopsQuery.fetcher = (variables?: AllStopsQueryVariables) =>
  fetcher<AllStopsQuery, AllStopsQueryVariables>(AllStopsDocument, variables);
