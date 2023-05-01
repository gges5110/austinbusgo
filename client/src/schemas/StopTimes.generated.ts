import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type StopTimesQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"];
}>;

export type StopTimesQuery = { __typename?: "Query" } & {
  stopTimes?: Types.Maybe<
    Array<
      { __typename?: "StopTimes" } & Pick<
        Types.StopTimes,
        "tripId" | "arrivalTime" | "departureTime" | "stopId" | "stopSequence"
      > & { stop: { __typename?: "Stop" } & Pick<Types.Stop, "stopName"> }
    >
  >;
};

export const StopTimesDocument = gql`
  query StopTimes($tripId: String!) {
    stopTimes(tripId: $tripId) {
      tripId
      arrivalTime
      departureTime
      stopId
      stopSequence
      stop {
        stopName
      }
    }
  }
`;

/**
 * __useStopTimesQuery__
 *
 * To run a query within a React component, call `useStopTimesQuery` and pass it any options that fit your needs.
 * When your component renders, `useStopTimesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStopTimesQuery({
 *   variables: {
 *      tripId: // value for 'tripId'
 *   },
 * });
 */
export function useStopTimesQuery(
  baseOptions?: Apollo.QueryHookOptions<StopTimesQuery, StopTimesQueryVariables>
) {
  return Apollo.useQuery<StopTimesQuery, StopTimesQueryVariables>(
    StopTimesDocument,
    baseOptions
  );
}
export function useStopTimesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    StopTimesQuery,
    StopTimesQueryVariables
  >
) {
  return Apollo.useLazyQuery<StopTimesQuery, StopTimesQueryVariables>(
    StopTimesDocument,
    baseOptions
  );
}
export type StopTimesQueryHookResult = ReturnType<typeof useStopTimesQuery>;
export type StopTimesLazyQueryHookResult = ReturnType<
  typeof useStopTimesLazyQuery
>;
