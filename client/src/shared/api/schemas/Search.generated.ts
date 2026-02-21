import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { graphQLEndpoint } from "config/config";
import * as Types from "shared/types/interface.d";

function fetcher<TData, TVariables>(query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(graphQLEndpoint as string, {
      method: "POST",
      ...{ headers: { "Content-Type": "application/json" } },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  };
}
export type SearchQueryVariables = Types.Exact<{
  searchTerm: Types.Scalars["String"]["input"];
}>;

export type SearchQuery = {
  __typename?: "Query";
  search: {
    __typename?: "Search";
    stops: Array<{
      __typename?: "Stop";
      stopId: string;
      stopName?: string | null;
      stopLoc?: {
        __typename?: "Point";
        type: Types.GeometryType;
        coordinates: Array<number>;
      } | null;
      routes?: Array<{
        __typename?: "Route";
        routeColor?: string | null;
        routeId: string;
      }> | null;
    }>;
    routes: Array<{
      __typename?: "Route";
      routeId: string;
      routeLongName: string;
      routeShortName?: string | null;
      routeColor?: string | null;
    }>;
  };
};

export const SearchDocument = `
    query Search($searchTerm: String!) {
  search(searchTerm: $searchTerm) {
    stops {
      stopId
      stopName
      stopLoc {
        type
        coordinates
      }
      routes {
        routeColor
        routeId
      }
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

export const useSearchQuery = <TData = SearchQuery, TError = unknown>(
  variables: SearchQueryVariables,
  options?: UseQueryOptions<SearchQuery, TError, TData>
) => {
  return useQuery<SearchQuery, TError, TData>(
    ["Search", variables],
    fetcher<SearchQuery, SearchQueryVariables>(SearchDocument, variables),
    options
  );
};

useSearchQuery.getKey = (variables: SearchQueryVariables) => [
  "Search",
  variables,
];

useSearchQuery.fetcher = (variables: SearchQueryVariables) =>
  fetcher<SearchQuery, SearchQueryVariables>(SearchDocument, variables);
