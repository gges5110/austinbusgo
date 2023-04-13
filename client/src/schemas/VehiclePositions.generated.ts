import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type VehiclePositionsQueryVariables = Types.Exact<{
  routeId: Types.Scalars["Int"];
  direction: Types.Scalars["Boolean"];
}>;

export type VehiclePositionsQuery = { __typename?: "Query" } & {
  vehiclePositions?: Types.Maybe<
    Array<
      { __typename?: "VehiclePosition" } & Pick<
        Types.VehiclePosition,
        "stopId" | "currentStatus" | "timestamp" | "congestionLevel"
      > & {
          trip?: Types.Maybe<
            { __typename?: "TripDescriptor" } & Pick<
              Types.TripDescriptor,
              "tripId" | "routeId" | "startDate" | "startTime"
            >
          >;
          vehicle?: Types.Maybe<
            { __typename?: "VehicleDescriptor" } & Pick<
              Types.VehicleDescriptor,
              "id" | "label" | "licensePlate"
            >
          >;
          position?: Types.Maybe<
            { __typename?: "Position" } & Pick<
              Types.Position,
              "latitude" | "longitude" | "bearing" | "speed"
            >
          >;
        }
    >
  >;
};

export const VehiclePositionsDocument = gql`
  query VehiclePositions($routeId: Int!, $direction: Boolean!) {
    vehiclePositions(routeId: $routeId, direction: $direction) {
      trip {
        tripId
        routeId
        startDate
        startTime
      }
      vehicle {
        id
        label
        licensePlate
      }
      position {
        latitude
        longitude
        bearing
        speed
      }
      stopId
      currentStatus
      timestamp
      congestionLevel
    }
  }
`;

/**
 * __useVehiclePositionsQuery__
 *
 * To run a query within a React component, call `useVehiclePositionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useVehiclePositionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useVehiclePositionsQuery({
 *   variables: {
 *      routeId: // value for 'routeId'
 *      direction: // value for 'direction'
 *   },
 * });
 */
export function useVehiclePositionsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    VehiclePositionsQuery,
    VehiclePositionsQueryVariables
  >
) {
  return Apollo.useQuery<VehiclePositionsQuery, VehiclePositionsQueryVariables>(
    VehiclePositionsDocument,
    baseOptions
  );
}
export function useVehiclePositionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    VehiclePositionsQuery,
    VehiclePositionsQueryVariables
  >
) {
  return Apollo.useLazyQuery<
    VehiclePositionsQuery,
    VehiclePositionsQueryVariables
  >(VehiclePositionsDocument, baseOptions);
}
export type VehiclePositionsQueryHookResult = ReturnType<
  typeof useVehiclePositionsQuery
>;
export type VehiclePositionsLazyQueryHookResult = ReturnType<
  typeof useVehiclePositionsLazyQuery
>;
