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
export type RouteQueryVariables = Types.Exact<{
  routeId: Types.Scalars["String"]["input"];
}>;

export type RouteQuery = {
  __typename?: "Query";
  route: {
    __typename?: "Route";
    routeLongName: string;
    routeId: string;
    routeColor?: string | null;
  };
};

export const RouteDocument = `
    query Route($routeId: String!) {
  route(routeId: $routeId) {
    routeLongName
    routeId
    routeColor
  }
}
    `;

export const useRouteQuery = <TData = RouteQuery, TError = unknown>(
  variables: RouteQueryVariables,
  options?: UseQueryOptions<RouteQuery, TError, TData>
) => {
  return useQuery<RouteQuery, TError, TData>(
    ["Route", variables],
    fetcher<RouteQuery, RouteQueryVariables>(RouteDocument, variables),
    options
  );
};

useRouteQuery.getKey = (variables: RouteQueryVariables) => ["Route", variables];

useRouteQuery.fetcher = (variables: RouteQueryVariables) =>
  fetcher<RouteQuery, RouteQueryVariables>(RouteDocument, variables);
