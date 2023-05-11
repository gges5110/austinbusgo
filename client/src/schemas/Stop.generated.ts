import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type StopQueryVariables = Types.Exact<{
  stopId: Types.Scalars["String"];
}>;

export type StopQuery = { __typename?: "Query" } & {
  stop: { __typename?: "Stop" } & Pick<
    Types.Stop,
    "stopId" | "stopCode" | "stopName"
  > & {
      stopLoc?: Types.Maybe<
        { __typename?: "Point" } & Pick<Types.Point, "type" | "coordinates">
      >;
    };
};

export const StopDocument = gql`
  query Stop($stopId: String!) {
    stop(stopId: $stopId) {
      stopId
      stopCode
      stopName
      stopLoc {
        type
        coordinates
      }
    }
  }
`;

/**
 * __useStopQuery__
 *
 * To run a query within a React component, call `useStopQuery` and pass it any options that fit your needs.
 * When your component renders, `useStopQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStopQuery({
 *   variables: {
 *      stopId: // value for 'stopId'
 *   },
 * });
 */
export function useStopQuery(
  baseOptions?: Apollo.QueryHookOptions<StopQuery, StopQueryVariables>
) {
  return Apollo.useQuery<StopQuery, StopQueryVariables>(
    StopDocument,
    baseOptions
  );
}
export function useStopLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<StopQuery, StopQueryVariables>
) {
  return Apollo.useLazyQuery<StopQuery, StopQueryVariables>(
    StopDocument,
    baseOptions
  );
}
export type StopQueryHookResult = ReturnType<typeof useStopQuery>;
export type StopLazyQueryHookResult = ReturnType<typeof useStopLazyQuery>;
