import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type StopsByNameQueryVariables = Types.Exact<{
  stopName: Types.Scalars["String"];
}>;

export type StopsByNameQuery = { __typename?: "Query" } & {
  stopsByName?: Types.Maybe<
    Array<
      { __typename?: "Stop" } & Pick<
        Types.Stop,
        "stopId" | "stopCode" | "stopName"
      > & {
          stopLoc?: Types.Maybe<
            { __typename?: "Point" } & Pick<Types.Point, "type" | "coordinates">
          >;
        }
    >
  >;
};

export const StopsByNameDocument = gql`
  query StopsByName($stopName: String!) {
    stopsByName(stopName: $stopName) {
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
 * __useStopsByNameQuery__
 *
 * To run a query within a React component, call `useStopsByNameQuery` and pass it any options that fit your needs.
 * When your component renders, `useStopsByNameQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStopsByNameQuery({
 *   variables: {
 *      stopName: // value for 'stopName'
 *   },
 * });
 */
export function useStopsByNameQuery(
  baseOptions?: Apollo.QueryHookOptions<
    StopsByNameQuery,
    StopsByNameQueryVariables
  >
) {
  return Apollo.useQuery<StopsByNameQuery, StopsByNameQueryVariables>(
    StopsByNameDocument,
    baseOptions
  );
}
export function useStopsByNameLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    StopsByNameQuery,
    StopsByNameQueryVariables
  >
) {
  return Apollo.useLazyQuery<StopsByNameQuery, StopsByNameQueryVariables>(
    StopsByNameDocument,
    baseOptions
  );
}
export type StopsByNameQueryHookResult = ReturnType<typeof useStopsByNameQuery>;
export type StopsByNameLazyQueryHookResult = ReturnType<
  typeof useStopsByNameLazyQuery
>;
