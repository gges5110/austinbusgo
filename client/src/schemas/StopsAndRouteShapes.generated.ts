import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type StopsQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"];
}>;

export type StopsQuery = { __typename?: "Query" } & {
  stops?: Types.Maybe<
    Array<
      { __typename?: "Stop" } & Pick<
        Types.Stop,
        "stopId" | "stopCode" | "stopName" | "stopLat" | "stopLon"
      >
    >
  >;
  routeShapes?: Types.Maybe<
    Array<
      { __typename?: "Shape" } & Pick<Types.Shape, "shapePtLat" | "shapePtLon">
    >
  >;
};

export const StopsDocument = gql`
  query Stops($tripId: String!) {
    stops(tripId: $tripId) {
      stopId
      stopCode
      stopName
      stopLat
      stopLon
    }
    routeShapes(tripId: $tripId) {
      shapePtLat
      shapePtLon
    }
  }
`;

/**
 * __useStopsQuery__
 *
 * To run a query within a React component, call `useStopsQuery` and pass it any options that fit your needs.
 * When your component renders, `useStopsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStopsQuery({
 *   variables: {
 *      tripId: // value for 'tripId'
 *   },
 * });
 */
export function useStopsQuery(
  baseOptions?: Apollo.QueryHookOptions<StopsQuery, StopsQueryVariables>
) {
  return Apollo.useQuery<StopsQuery, StopsQueryVariables>(
    StopsDocument,
    baseOptions
  );
}
export function useStopsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<StopsQuery, StopsQueryVariables>
) {
  return Apollo.useLazyQuery<StopsQuery, StopsQueryVariables>(
    StopsDocument,
    baseOptions
  );
}
export type StopsQueryHookResult = ReturnType<typeof useStopsQuery>;
export type StopsLazyQueryHookResult = ReturnType<typeof useStopsLazyQuery>;
