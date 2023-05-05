import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type DistinctTripsQueryVariables = Types.Exact<{
  routeId: Types.Scalars["String"];
  date: Types.Scalars["String"];
}>;

export type DistinctTripsQuery = { __typename?: "Query" } & {
  distinctTrips?: Types.Maybe<
    Array<
      { __typename?: "Trip" } & Pick<
        Types.Trip,
        "tripId" | "tripShortName" | "directionId"
      >
    >
  >;
};

export const DistinctTripsDocument = gql`
  query DistinctTrips($routeId: String!, $date: String!) {
    distinctTrips(routeId: $routeId, date: $date) {
      tripId
      tripShortName
      directionId
    }
  }
`;

/**
 * __useDistinctTripsQuery__
 *
 * To run a query within a React component, call `useDistinctTripsQuery` and pass it any options that fit your needs.
 * When your component renders, `useDistinctTripsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDistinctTripsQuery({
 *   variables: {
 *      routeId: // value for 'routeId'
 *      date: // value for 'date'
 *   },
 * });
 */
export function useDistinctTripsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    DistinctTripsQuery,
    DistinctTripsQueryVariables
  >
) {
  return Apollo.useQuery<DistinctTripsQuery, DistinctTripsQueryVariables>(
    DistinctTripsDocument,
    baseOptions
  );
}
export function useDistinctTripsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    DistinctTripsQuery,
    DistinctTripsQueryVariables
  >
) {
  return Apollo.useLazyQuery<DistinctTripsQuery, DistinctTripsQueryVariables>(
    DistinctTripsDocument,
    baseOptions
  );
}
export type DistinctTripsQueryHookResult = ReturnType<
  typeof useDistinctTripsQuery
>;
export type DistinctTripsLazyQueryHookResult = ReturnType<
  typeof useDistinctTripsLazyQuery
>;
