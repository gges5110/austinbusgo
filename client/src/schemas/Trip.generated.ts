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
export type TripQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"];
}>;

export type TripQuery = { __typename?: "Query" } & {
  trip: { __typename?: "TripWithRoute" } & Pick<
    Types.TripWithRoute,
    | "routeId"
    | "serviceId"
    | "tripId"
    | "tripHeadsign"
    | "tripShortName"
    | "directionId"
    | "blockId"
    | "shapeId"
    | "wheelchairAccessible"
    | "bikesAllowed"
  > & {
      route: { __typename?: "Route" } & Pick<
        Types.Route,
        "routeLongName" | "routeColor"
      >;
    };
};

export const TripDocument = `
    query Trip($tripId: String!) {
  trip(tripId: $tripId) {
    routeId
    serviceId
    tripId
    tripHeadsign
    tripShortName
    directionId
    blockId
    shapeId
    wheelchairAccessible
    bikesAllowed
    route {
      routeLongName
      routeColor
    }
  }
}
    `;
export const useTripQuery = <TData = TripQuery, TError = unknown>(
  variables: TripQueryVariables,
  options?: UseQueryOptions<TripQuery, TError, TData>
) =>
  useQuery<TripQuery, TError, TData>(
    ["Trip", variables],
    fetcher<TripQuery, TripQueryVariables>(TripDocument, variables),
    options
  );

useTripQuery.getKey = (variables: TripQueryVariables) => ["Trip", variables];
useTripQuery.fetcher = (variables: TripQueryVariables) =>
  fetcher<TripQuery, TripQueryVariables>(TripDocument, variables);
