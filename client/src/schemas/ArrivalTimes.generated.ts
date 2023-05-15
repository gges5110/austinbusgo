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
export type ArrivalTimesQueryVariables = Types.Exact<{
  stopId: Types.Scalars["String"];
  date: Types.Scalars["String"];
}>;

export type ArrivalTimesQuery = { __typename?: "Query" } & {
  arrivalTimes?: Types.Maybe<
    Array<
      { __typename?: "ArrivalTime" } & Pick<
        Types.ArrivalTime,
        "updatedArrivalTime" | "scheduledArrivalTime"
      > & {
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
                "routeColor" | "routeLongName"
              >;
            };
          vehicle?: Types.Maybe<
            { __typename?: "VehiclePosition" } & Pick<
              Types.VehiclePosition,
              "stopId" | "currentStatus" | "timestamp"
            > & {
                trip?: Types.Maybe<
                  { __typename?: "TripDescriptor" } & Pick<
                    Types.TripDescriptor,
                    "tripId" | "routeId" | "startDate"
                  >
                >;
                vehicle?: Types.Maybe<
                  { __typename?: "VehicleDescriptor" } & Pick<
                    Types.VehicleDescriptor,
                    "id" | "label"
                  >
                >;
                position?: Types.Maybe<
                  { __typename?: "Position" } & Pick<
                    Types.Position,
                    "latitude" | "longitude"
                  >
                >;
              }
          >;
        }
    >
  >;
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
    vehicle {
      trip {
        tripId
        routeId
        startDate
      }
      vehicle {
        id
        label
      }
      position {
        latitude
        longitude
      }
      stopId
      currentStatus
      timestamp
    }
  }
}
    `;
export const useArrivalTimesQuery = <
  TData = ArrivalTimesQuery,
  TError = unknown
>(
  variables: ArrivalTimesQueryVariables,
  options?: UseQueryOptions<ArrivalTimesQuery, TError, TData>
) =>
  useQuery<ArrivalTimesQuery, TError, TData>(
    ["ArrivalTimes", variables],
    fetcher<ArrivalTimesQuery, ArrivalTimesQueryVariables>(
      ArrivalTimesDocument,
      variables
    ),
    options
  );

useArrivalTimesQuery.getKey = (variables: ArrivalTimesQueryVariables) => [
  "ArrivalTimes",
  variables,
];
useArrivalTimesQuery.fetcher = (variables: ArrivalTimesQueryVariables) =>
  fetcher<ArrivalTimesQuery, ArrivalTimesQueryVariables>(
    ArrivalTimesDocument,
    variables
  );
