import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type RouteQueryVariables = Types.Exact<{
  routeId: Types.Scalars["Int"];
}>;

export type RouteQuery = { __typename?: "Query" } & {
  route: { __typename?: "Route" } & Pick<
    Types.Route,
    "routeLongName" | "routeId" | "routeColor"
  >;
};

export const RouteDocument = gql`
  query Route($routeId: Int!) {
    route(routeId: $routeId) {
      routeLongName
      routeId
      routeColor
    }
  }
`;

/**
 * __useRouteQuery__
 *
 * To run a query within a React component, call `useRouteQuery` and pass it any options that fit your needs.
 * When your component renders, `useRouteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRouteQuery({
 *   variables: {
 *      routeId: // value for 'routeId'
 *   },
 * });
 */
export function useRouteQuery(
  baseOptions?: Apollo.QueryHookOptions<RouteQuery, RouteQueryVariables>
) {
  return Apollo.useQuery<RouteQuery, RouteQueryVariables>(
    RouteDocument,
    baseOptions
  );
}
export function useRouteLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<RouteQuery, RouteQueryVariables>
) {
  return Apollo.useLazyQuery<RouteQuery, RouteQueryVariables>(
    RouteDocument,
    baseOptions
  );
}
export type RouteQueryHookResult = ReturnType<typeof useRouteQuery>;
export type RouteLazyQueryHookResult = ReturnType<typeof useRouteLazyQuery>;
