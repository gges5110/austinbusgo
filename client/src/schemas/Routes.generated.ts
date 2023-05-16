import * as Types from "../interfaces/interface.d";

import { graphQLEndpoint } from "../config";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

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
export type RoutesQueryVariables = Types.Exact<{ [key: string]: never }>;

export type RoutesQuery = { __typename?: "Query" } & {
  routes: Array<
    { __typename?: "Route" } & Pick<
      Types.Route,
      "routeLongName" | "routeId" | "routeColor"
    >
  >;
};

export const RoutesDocument = `
    query Routes {
  routes {
    routeLongName
    routeId
    routeColor
  }
}
    `;
export const useRoutesQuery = <TData = RoutesQuery, TError = unknown>(
  variables?: RoutesQueryVariables,
  options?: UseQueryOptions<RoutesQuery, TError, TData>
) =>
  useQuery<RoutesQuery, TError, TData>(
    variables === undefined ? ["Routes"] : ["Routes", variables],
    fetcher<RoutesQuery, RoutesQueryVariables>(RoutesDocument, variables),
    options
  );

useRoutesQuery.getKey = (variables?: RoutesQueryVariables) =>
  variables === undefined ? ["Routes"] : ["Routes", variables];
useRoutesQuery.fetcher = (variables?: RoutesQueryVariables) =>
  fetcher<RoutesQuery, RoutesQueryVariables>(RoutesDocument, variables);
