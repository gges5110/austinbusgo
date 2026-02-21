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
export type EarliestArrivalTimesOnRouteQueryVariables = Types.Exact<{
  routeId: Types.Scalars["String"]["input"];
  directionId: Types.Scalars["Int"]["input"];
  date: Types.Scalars["String"]["input"];
  time: Types.Scalars["String"]["input"];
}>;

export type EarliestArrivalTimesOnRouteQuery = {
  __typename?: "Query";
  earliestArrivalTimesOnRoute: Array<{
    __typename?: "ArrivalTimeAtStop";
    stopSequence: number;
    stopId: string;
    scheduledArrivalTime: string;
    updatedArrivalTime?: string | null;
    tripId?: string | null;
  }>;
};

export const EarliestArrivalTimesOnRouteDocument = `
    query EarliestArrivalTimesOnRoute($routeId: String!, $directionId: Int!, $date: String!, $time: String!) {
  earliestArrivalTimesOnRoute(
    routeId: $routeId
    directionId: $directionId
    date: $date
    time: $time
  ) {
    stopSequence
    stopId
    scheduledArrivalTime
    updatedArrivalTime
    tripId
  }
}
    `;

export const useEarliestArrivalTimesOnRouteQuery = <
  TData = EarliestArrivalTimesOnRouteQuery,
  TError = unknown,
>(
  variables: EarliestArrivalTimesOnRouteQueryVariables,
  options?: UseQueryOptions<EarliestArrivalTimesOnRouteQuery, TError, TData>
) => {
  return useQuery<EarliestArrivalTimesOnRouteQuery, TError, TData>(
    ["EarliestArrivalTimesOnRoute", variables],
    fetcher<
      EarliestArrivalTimesOnRouteQuery,
      EarliestArrivalTimesOnRouteQueryVariables
    >(EarliestArrivalTimesOnRouteDocument, variables),
    options
  );
};

useEarliestArrivalTimesOnRouteQuery.getKey = (
  variables: EarliestArrivalTimesOnRouteQueryVariables
) => ["EarliestArrivalTimesOnRoute", variables];

useEarliestArrivalTimesOnRouteQuery.fetcher = (
  variables: EarliestArrivalTimesOnRouteQueryVariables
) =>
  fetcher<
    EarliestArrivalTimesOnRouteQuery,
    EarliestArrivalTimesOnRouteQueryVariables
  >(EarliestArrivalTimesOnRouteDocument, variables);
