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
export type TripQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
}>;

export type TripQuery = {
  __typename?: "Query";
  trip: {
    __typename?: "Trip";
    routeId: string;
    serviceId: string;
    tripId: string;
    tripHeadsign?: string | null;
    tripShortName?: string | null;
    directionId?: number | null;
    blockId?: string | null;
    shapeId?: string | null;
    wheelchairAccessible?: number | null;
    bikesAllowed?: number | null;
    route: {
      __typename?: "Route";
      routeId: string;
      routeLongName: string;
      routeColor?: string | null;
    };
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
      routeId
      routeLongName
      routeColor
    }
  }
}
    `;

export const useTripQuery = <TData = TripQuery, TError = unknown>(
  variables: TripQueryVariables,
  options?: UseQueryOptions<TripQuery, TError, TData>
) => {
  return useQuery<TripQuery, TError, TData>(
    ["Trip", variables],
    fetcher<TripQuery, TripQueryVariables>(TripDocument, variables),
    options
  );
};

useTripQuery.getKey = (variables: TripQueryVariables) => ["Trip", variables];

useTripQuery.fetcher = (variables: TripQueryVariables) =>
  fetcher<TripQuery, TripQueryVariables>(TripDocument, variables);
