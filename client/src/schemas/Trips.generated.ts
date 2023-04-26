import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type TripsQueryVariables = Types.Exact<{
  date: Types.Scalars["String"];
}>;

export type TripsQuery = { __typename?: "Query" } & {
  trips?: Types.Maybe<
    Array<
      { __typename?: "RunningTrip" } & Pick<
        Types.RunningTrip,
        | "routeLongName"
        | "routeId"
        | "direction"
        | "color"
        | "running"
        | "dirAbbr"
      >
    >
  >;
};

export const TripsDocument = gql`
  query Trips($date: String!) {
    trips(date: $date) {
      routeLongName
      routeId
      direction
      color
      running
      dirAbbr
    }
  }
`;

/**
 * __useTripsQuery__
 *
 * To run a query within a React component, call `useTripsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTripsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTripsQuery({
 *   variables: {
 *      date: // value for 'date'
 *   },
 * });
 */
export function useTripsQuery(
  baseOptions?: Apollo.QueryHookOptions<TripsQuery, TripsQueryVariables>
) {
  return Apollo.useQuery<TripsQuery, TripsQueryVariables>(
    TripsDocument,
    baseOptions
  );
}
export function useTripsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<TripsQuery, TripsQueryVariables>
) {
  return Apollo.useLazyQuery<TripsQuery, TripsQueryVariables>(
    TripsDocument,
    baseOptions
  );
}
export type TripsQueryHookResult = ReturnType<typeof useTripsQuery>;
export type TripsLazyQueryHookResult = ReturnType<typeof useTripsLazyQuery>;
