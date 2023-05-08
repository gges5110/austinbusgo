import * as Types from "../interfaces/interface.d";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type SearchQueryVariables = Types.Exact<{
  searchTerm: Types.Scalars["String"];
}>;

export type SearchQuery = { __typename?: "Query" } & {
  search: { __typename?: "Search" } & {
    stops: Array<
      { __typename?: "Stop" } & Pick<Types.Stop, "stopId" | "stopName">
    >;
    routes: Array<
      { __typename?: "Route" } & Pick<
        Types.Route,
        "routeId" | "routeLongName" | "routeShortName" | "routeColor"
      >
    >;
  };
};

export const SearchDocument = gql`
  query Search($searchTerm: String!) {
    search(searchTerm: $searchTerm) {
      stops {
        stopId
        stopName
      }
      routes {
        routeId
        routeLongName
        routeShortName
        routeColor
      }
    }
  }
`;

/**
 * __useSearchQuery__
 *
 * To run a query within a React component, call `useSearchQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchQuery({
 *   variables: {
 *      searchTerm: // value for 'searchTerm'
 *   },
 * });
 */
export function useSearchQuery(
  baseOptions?: Apollo.QueryHookOptions<SearchQuery, SearchQueryVariables>
) {
  return Apollo.useQuery<SearchQuery, SearchQueryVariables>(
    SearchDocument,
    baseOptions
  );
}
export function useSearchLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SearchQuery, SearchQueryVariables>
) {
  return Apollo.useLazyQuery<SearchQuery, SearchQueryVariables>(
    SearchDocument,
    baseOptions
  );
}
export type SearchQueryHookResult = ReturnType<typeof useSearchQuery>;
export type SearchLazyQueryHookResult = ReturnType<typeof useSearchLazyQuery>;
