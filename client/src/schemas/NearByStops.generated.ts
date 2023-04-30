import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type NearByStopsQueryVariables = Types.Exact<{
  lat: Types.Scalars["Float"];
  lon: Types.Scalars["Float"];
}>;

export type NearByStopsQuery = { __typename?: "Query" } & {
  nearByStops: Array<
    { __typename?: "Stop" } & Pick<
      Types.Stop,
      "stopId" | "stopCode" | "stopName" | "stopLat" | "stopLon"
    >
  >;
};

export const NearByStopsDocument = gql`
  query NearByStops($lat: Float!, $lon: Float!) {
    nearByStops(lat: $lat, lon: $lon) {
      stopId
      stopCode
      stopName
      stopLat
      stopLon
    }
  }
`;

/**
 * __useNearByStopsQuery__
 *
 * To run a query within a React component, call `useNearByStopsQuery` and pass it any options that fit your needs.
 * When your component renders, `useNearByStopsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useNearByStopsQuery({
 *   variables: {
 *      lat: // value for 'lat'
 *      lon: // value for 'lon'
 *   },
 * });
 */
export function useNearByStopsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    NearByStopsQuery,
    NearByStopsQueryVariables
  >
) {
  return Apollo.useQuery<NearByStopsQuery, NearByStopsQueryVariables>(
    NearByStopsDocument,
    baseOptions
  );
}
export function useNearByStopsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    NearByStopsQuery,
    NearByStopsQueryVariables
  >
) {
  return Apollo.useLazyQuery<NearByStopsQuery, NearByStopsQueryVariables>(
    NearByStopsDocument,
    baseOptions
  );
}
export type NearByStopsQueryHookResult = ReturnType<typeof useNearByStopsQuery>;
export type NearByStopsLazyQueryHookResult = ReturnType<
  typeof useNearByStopsLazyQuery
>;
