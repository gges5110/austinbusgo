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
export type ArrivalTimesQueryVariables = Types.Exact<{
  stopId: Types.Scalars["String"]["input"];
  date: Types.Scalars["String"]["input"];
}>;

export type ArrivalTimesQuery = {
  __typename?: "Query";
  arrivalTimes: Array<{
    __typename?: "ArrivalTime";
    updatedArrivalTime?: string | null;
    scheduledArrivalTime: string;
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
        routeColor?: string | null;
        routeLongName: string;
      };
    };
  }>;
};

export const ArrivalTimesDocument = `
    query ArrivalTimes($stopId: String!, $date: String!) {
  arrivalTimes(stopId: $stopId, date: $date) {
    updatedArrivalTime
    scheduledArrivalTime
    trip {
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
        routeColor
        routeLongName
      }
    }
  }
}
    `;

export const useArrivalTimesQuery = <
  TData = ArrivalTimesQuery,
  TError = unknown,
>(
  variables: ArrivalTimesQueryVariables,
  options?: UseQueryOptions<ArrivalTimesQuery, TError, TData>
) => {
  return useQuery<ArrivalTimesQuery, TError, TData>(
    ["ArrivalTimes", variables],
    fetcher<ArrivalTimesQuery, ArrivalTimesQueryVariables>(
      ArrivalTimesDocument,
      variables
    ),
    options
  );
};

useArrivalTimesQuery.getKey = (variables: ArrivalTimesQueryVariables) => [
  "ArrivalTimes",
  variables,
];

useArrivalTimesQuery.fetcher = (variables: ArrivalTimesQueryVariables) =>
  fetcher<ArrivalTimesQuery, ArrivalTimesQueryVariables>(
    ArrivalTimesDocument,
    variables
  );
