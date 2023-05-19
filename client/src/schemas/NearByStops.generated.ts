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
export type NearByStopsQueryVariables = Types.Exact<{
  lat: Types.Scalars["Float"];
  lon: Types.Scalars["Float"];
}>;

export type NearByStopsQuery = { __typename?: "Query" } & {
  nearByStops: Array<
    { __typename?: "Stop" } & Pick<
      Types.Stop,
      "stopId" | "stopCode" | "stopName"
    > & {
        stopLoc?: Types.Maybe<
          { __typename?: "Point" } & Pick<Types.Point, "type" | "coordinates">
        >;
        routes?: Types.Maybe<
          Array<
            { __typename?: "Route" } & Pick<
              Types.Route,
              "routeId" | "routeColor"
            >
          >
        >;
      }
  >;
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
    }
  }
}
    `;
export const useNearByStopsQuery = <TData = NearByStopsQuery, TError = unknown>(
  variables: NearByStopsQueryVariables,
  options?: UseQueryOptions<NearByStopsQuery, TError, TData>
) =>
  useQuery<NearByStopsQuery, TError, TData>(
    ["NearByStops", variables],
    fetcher<NearByStopsQuery, NearByStopsQueryVariables>(
      NearByStopsDocument,
      variables
    ),
    options
  );

useNearByStopsQuery.getKey = (variables: NearByStopsQueryVariables) => [
  "NearByStops",
  variables,
];
useNearByStopsQuery.fetcher = (variables: NearByStopsQueryVariables) =>
  fetcher<NearByStopsQuery, NearByStopsQueryVariables>(
    NearByStopsDocument,
    variables
  );
