import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type RunningTripsQueryVariables = Types.Exact<{
  filterInput?: Types.Maybe<Types.RunningTripFilterInput>;
}>;

export type RunningTripsQuery = { __typename?: "Query" } & {
  runningTrips?: Types.Maybe<
    Array<
      { __typename?: "RunningTrip" } & Pick<
        Types.RunningTrip,
        "name" | "routeId" | "direction" | "color" | "tripId"
      >
    >
  >;
};

export const RunningTripsDocument = gql`
  query RunningTrips($filterInput: RunningTripFilterInput) {
    runningTrips(filterInput: $filterInput) {
      name
      routeId
      direction
      color
      tripId
    }
  }
`;

/**
 * __useRunningTripsQuery__
 *
 * To run a query within a React component, call `useRunningTripsQuery` and pass it any options that fit your needs.
 * When your component renders, `useRunningTripsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRunningTripsQuery({
 *   variables: {
 *      filterInput: // value for 'filterInput'
 *   },
 * });
 */
export function useRunningTripsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    RunningTripsQuery,
    RunningTripsQueryVariables
  >
) {
  return Apollo.useQuery<RunningTripsQuery, RunningTripsQueryVariables>(
    RunningTripsDocument,
    baseOptions
  );
}
export function useRunningTripsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    RunningTripsQuery,
    RunningTripsQueryVariables
  >
) {
  return Apollo.useLazyQuery<RunningTripsQuery, RunningTripsQueryVariables>(
    RunningTripsDocument,
    baseOptions
  );
}
export type RunningTripsQueryHookResult = ReturnType<
  typeof useRunningTripsQuery
>;
export type RunningTripsLazyQueryHookResult = ReturnType<
  typeof useRunningTripsLazyQuery
>;
