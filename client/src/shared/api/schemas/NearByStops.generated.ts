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
export type NearByStopsQueryVariables = Types.Exact<{
  lat: Types.Scalars["Float"]["input"];
  lon: Types.Scalars["Float"]["input"];
}>;

export type NearByStopsQuery = {
  __typename?: "Query";
  nearByStops: Array<{
    __typename?: "Stop";
    stopId: string;
    stopCode?: string | null;
    stopName?: string | null;
    stopLoc?: {
      __typename?: "Point";
      type: Types.GeometryType;
      coordinates: Array<number>;
    } | null;
    routes?: Array<{
      __typename?: "Route";
      routeId: string;
      routeColor?: string | null;
      routeLongName: string;
    }> | null;
  }>;
};

export const NearByStopsDocument = `
    query NearByStops($lat: Float!, $lon: Float!) {
  nearByStops(lat: $lat, lon: $lon) {
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

export const useNearByStopsQuery = <TData = NearByStopsQuery, TError = unknown>(
  variables: NearByStopsQueryVariables,
  options?: UseQueryOptions<NearByStopsQuery, TError, TData>
) => {
  return useQuery<NearByStopsQuery, TError, TData>(
    ["NearByStops", variables],
    fetcher<NearByStopsQuery, NearByStopsQueryVariables>(
      NearByStopsDocument,
      variables
    ),
    options
  );
};

useNearByStopsQuery.getKey = (variables: NearByStopsQueryVariables) => [
  "NearByStops",
  variables,
];

useNearByStopsQuery.fetcher = (variables: NearByStopsQueryVariables) =>
  fetcher<NearByStopsQuery, NearByStopsQueryVariables>(
    NearByStopsDocument,
    variables
  );
