import * as Types from "../../types/interface.d";

import { graphQLEndpoint } from "../../../config/config";
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
export type TripIdsForRouteQueryVariables = Types.Exact<{
  routeId: Types.Scalars["String"];
  date: Types.Scalars["String"];
}>;

export type TripIdsForRouteQuery = { __typename?: "Query" } & {
  tripIdsForRoute: { __typename?: "TripIdsForRoute" } & Pick<
    Types.TripIdsForRoute,
    "tripIds"
  >;
};

export const TripIdsForRouteDocument = `
    query TripIdsForRoute($routeId: String!, $date: String!) {
  tripIdsForRoute(routeId: $routeId, date: $date) {
    tripIds
  }
}
    `;
export const useTripIdsForRouteQuery = <
  TData = TripIdsForRouteQuery,
  TError = unknown
>(
  variables: TripIdsForRouteQueryVariables,
  options?: UseQueryOptions<TripIdsForRouteQuery, TError, TData>
) =>
  useQuery<TripIdsForRouteQuery, TError, TData>(
    ["TripIdsForRoute", variables],
    fetcher<TripIdsForRouteQuery, TripIdsForRouteQueryVariables>(
      TripIdsForRouteDocument,
      variables
    ),
    options
  );

useTripIdsForRouteQuery.getKey = (variables: TripIdsForRouteQueryVariables) => [
  "TripIdsForRoute",
  variables,
];
useTripIdsForRouteQuery.fetcher = (variables: TripIdsForRouteQueryVariables) =>
  fetcher<TripIdsForRouteQuery, TripIdsForRouteQueryVariables>(
    TripIdsForRouteDocument,
    variables
  );
