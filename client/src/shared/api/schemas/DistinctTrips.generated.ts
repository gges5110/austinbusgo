import * as Types from "shared/types/interface.d";

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
export type DistinctTripsQueryVariables = Types.Exact<{
  routeId: Types.Scalars["String"];
  date: Types.Scalars["String"];
}>;

export type DistinctTripsQuery = { __typename?: "Query" } & {
  distinctTrips: Array<
    { __typename?: "Trip" } & Pick<
      Types.Trip,
      "tripId" | "tripShortName" | "directionId"
    >
  >;
};

export const DistinctTripsDocument = `
    query DistinctTrips($routeId: String!, $date: String!) {
  distinctTrips(routeId: $routeId, date: $date) {
    tripId
    tripShortName
    directionId
  }
}
    `;
export const useDistinctTripsQuery = <
  TData = DistinctTripsQuery,
  TError = unknown
>(
  variables: DistinctTripsQueryVariables,
  options?: UseQueryOptions<DistinctTripsQuery, TError, TData>
) =>
  useQuery<DistinctTripsQuery, TError, TData>(
    ["DistinctTrips", variables],
    fetcher<DistinctTripsQuery, DistinctTripsQueryVariables>(
      DistinctTripsDocument,
      variables
    ),
    options
  );

useDistinctTripsQuery.getKey = (variables: DistinctTripsQueryVariables) => [
  "DistinctTrips",
  variables,
];
useDistinctTripsQuery.fetcher = (variables: DistinctTripsQueryVariables) =>
  fetcher<DistinctTripsQuery, DistinctTripsQueryVariables>(
    DistinctTripsDocument,
    variables
  );
