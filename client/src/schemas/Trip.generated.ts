import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type TripQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"];
}>;

export type TripQuery = { __typename?: "Query" } & {
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
};

export const TripDocument = gql`
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
    }
  }
`;

/**
 * __useTripQuery__
 *
 * To run a query within a React component, call `useTripQuery` and pass it any options that fit your needs.
 * When your component renders, `useTripQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTripQuery({
 *   variables: {
 *      tripId: // value for 'tripId'
 *   },
 * });
 */
export function useTripQuery(
  baseOptions?: Apollo.QueryHookOptions<TripQuery, TripQueryVariables>
) {
  return Apollo.useQuery<TripQuery, TripQueryVariables>(
    TripDocument,
    baseOptions
  );
}
export function useTripLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<TripQuery, TripQueryVariables>
) {
  return Apollo.useLazyQuery<TripQuery, TripQueryVariables>(
    TripDocument,
    baseOptions
  );
}
export type TripQueryHookResult = ReturnType<typeof useTripQuery>;
export type TripLazyQueryHookResult = ReturnType<typeof useTripLazyQuery>;
