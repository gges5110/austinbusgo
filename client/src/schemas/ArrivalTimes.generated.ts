import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type ArrivalTimesQueryVariables = Types.Exact<{
  routeId: Types.Scalars["Int"];
  direction: Types.Scalars["Boolean"];
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
          trip: { __typename?: "Trip" } & Pick<
            Types.Trip,
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
          >;
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

export const ArrivalTimesDocument = gql`
  query ArrivalTimes(
    $routeId: Int!
    $direction: Boolean!
    $stopId: String!
    $date: String!
  ) {
    arrivalTimes(
      routeId: $routeId
      direction: $direction
      stopId: $stopId
      date: $date
    ) {
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

/**
 * __useArrivalTimesQuery__
 *
 * To run a query within a React component, call `useArrivalTimesQuery` and pass it any options that fit your needs.
 * When your component renders, `useArrivalTimesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useArrivalTimesQuery({
 *   variables: {
 *      routeId: // value for 'routeId'
 *      direction: // value for 'direction'
 *      stopId: // value for 'stopId'
 *      date: // value for 'date'
 *   },
 * });
 */
export function useArrivalTimesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ArrivalTimesQuery,
    ArrivalTimesQueryVariables
  >
) {
  return Apollo.useQuery<ArrivalTimesQuery, ArrivalTimesQueryVariables>(
    ArrivalTimesDocument,
    baseOptions
  );
}
export function useArrivalTimesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ArrivalTimesQuery,
    ArrivalTimesQueryVariables
  >
) {
  return Apollo.useLazyQuery<ArrivalTimesQuery, ArrivalTimesQueryVariables>(
    ArrivalTimesDocument,
    baseOptions
  );
}
export type ArrivalTimesQueryHookResult = ReturnType<
  typeof useArrivalTimesQuery
>;
export type ArrivalTimesLazyQueryHookResult = ReturnType<
  typeof useArrivalTimesLazyQuery
>;
