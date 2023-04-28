import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type RoutesQueryVariables = Types.Exact<{ [key: string]: never }>;

export type RoutesQuery = { __typename?: "Query" } & {
  routes?: Types.Maybe<
    Array<
      { __typename?: "Route" } & Pick<
        Types.Route,
        "routeLongName" | "routeId" | "routeColor"
      >
    >
  >;
};

export const RoutesDocument = gql`
  query Routes {
    routes {
      routeLongName
      routeId
      routeColor
    }
  }
`;

/**
 * __useRoutesQuery__
 *
 * To run a query within a React component, call `useRoutesQuery` and pass it any options that fit your needs.
 * When your component renders, `useRoutesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRoutesQuery({
 *   variables: {
 *   },
 * });
 */
export function useRoutesQuery(
  baseOptions?: Apollo.QueryHookOptions<RoutesQuery, RoutesQueryVariables>
) {
  return Apollo.useQuery<RoutesQuery, RoutesQueryVariables>(
    RoutesDocument,
    baseOptions
  );
}
export function useRoutesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<RoutesQuery, RoutesQueryVariables>
) {
  return Apollo.useLazyQuery<RoutesQuery, RoutesQueryVariables>(
    RoutesDocument,
    baseOptions
  );
}
export type RoutesQueryHookResult = ReturnType<typeof useRoutesQuery>;
export type RoutesLazyQueryHookResult = ReturnType<typeof useRoutesLazyQuery>;
