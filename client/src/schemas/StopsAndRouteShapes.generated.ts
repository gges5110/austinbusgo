import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type StopsAndShapesQueryVariables = Types.Exact<{
  routeId: Types.Scalars["String"];
  directionId: Types.Scalars["Int"];
  date: Types.Scalars["String"];
}>;

export type StopsAndShapesQuery = { __typename?: "Query" } & {
  stopsAndShapes: { __typename?: "StopsAndShapes" } & {
    stops?: Types.Maybe<
      Array<
        { __typename?: "Stop" } & Pick<
          Types.Stop,
          "stopId" | "stopCode" | "stopName" | "stopLat" | "stopLon"
        >
      >
    >;
    shapes?: Types.Maybe<
      Array<
        Array<
          { __typename?: "Shape" } & Pick<
            Types.Shape,
            "shapePtLat" | "shapePtLon"
          >
        >
      >
    >;
  };
  distinctTrips?: Types.Maybe<
    Array<
      { __typename?: "Trip" } & Pick<
        Types.Trip,
        "tripId" | "tripShortName" | "directionId"
      >
    >
  >;
};

export const StopsAndShapesDocument = gql`
  query StopsAndShapes($routeId: String!, $directionId: Int!, $date: String!) {
    stopsAndShapes(routeId: $routeId, directionId: $directionId, date: $date) {
      stops {
        stopId
        stopCode
        stopName
        stopLat
        stopLon
      }
      shapes {
        shapePtLat
        shapePtLon
      }
    }
    distinctTrips(routeId: $routeId, date: $date) {
      tripId
      tripShortName
      directionId
    }
  }
`;

/**
 * __useStopsAndShapesQuery__
 *
 * To run a query within a React component, call `useStopsAndShapesQuery` and pass it any options that fit your needs.
 * When your component renders, `useStopsAndShapesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStopsAndShapesQuery({
 *   variables: {
 *      routeId: // value for 'routeId'
 *      directionId: // value for 'directionId'
 *      date: // value for 'date'
 *   },
 * });
 */
export function useStopsAndShapesQuery(
  baseOptions?: Apollo.QueryHookOptions<
    StopsAndShapesQuery,
    StopsAndShapesQueryVariables
  >
) {
  return Apollo.useQuery<StopsAndShapesQuery, StopsAndShapesQueryVariables>(
    StopsAndShapesDocument,
    baseOptions
  );
}
export function useStopsAndShapesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    StopsAndShapesQuery,
    StopsAndShapesQueryVariables
  >
) {
  return Apollo.useLazyQuery<StopsAndShapesQuery, StopsAndShapesQueryVariables>(
    StopsAndShapesDocument,
    baseOptions
  );
}
export type StopsAndShapesQueryHookResult = ReturnType<
  typeof useStopsAndShapesQuery
>;
export type StopsAndShapesLazyQueryHookResult = ReturnType<
  typeof useStopsAndShapesLazyQuery
>;
