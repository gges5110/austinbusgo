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
export type TripUpdateQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"];
}>;

export type TripUpdateQuery = { __typename?: "Query" } & {
  tripUpdate?: Types.Maybe<
    { __typename?: "TripUpdate" } & {
      trip: { __typename?: "TripDescriptor" } & Pick<
        Types.TripDescriptor,
        "tripId" | "startDate" | "startTime" | "routeId"
      >;
      stopTimeUpdate: Array<
        Types.Maybe<
          { __typename?: "StopTimeUpdate" } & Pick<
            Types.StopTimeUpdate,
            "stopId" | "stopSequence"
          > & {
              arrival?: Types.Maybe<
                { __typename?: "StopTimeEvent" } & Pick<
                  Types.StopTimeEvent,
                  "time" | "delay"
                >
              >;
              departure?: Types.Maybe<
                { __typename?: "StopTimeEvent" } & Pick<
                  Types.StopTimeEvent,
                  "time" | "delay"
                >
              >;
            }
        >
      >;
    }
  >;
};

export const TripUpdateDocument = `
    query TripUpdate($tripId: String!) {
  tripUpdate(tripId: $tripId) {
    trip {
      tripId
      startDate
      startTime
      routeId
    }
    stopTimeUpdate {
      stopId
      stopSequence
      arrival {
        time
        delay
      }
      departure {
        time
        delay
      }
    }
  }
}
    `;
export const useTripUpdateQuery = <TData = TripUpdateQuery, TError = unknown>(
  variables: TripUpdateQueryVariables,
  options?: UseQueryOptions<TripUpdateQuery, TError, TData>
) =>
  useQuery<TripUpdateQuery, TError, TData>(
    ["TripUpdate", variables],
    fetcher<TripUpdateQuery, TripUpdateQueryVariables>(
      TripUpdateDocument,
      variables
    ),
    options
  );

useTripUpdateQuery.getKey = (variables: TripUpdateQueryVariables) => [
  "TripUpdate",
  variables,
];
useTripUpdateQuery.fetcher = (variables: TripUpdateQueryVariables) =>
  fetcher<TripUpdateQuery, TripUpdateQueryVariables>(
    TripUpdateDocument,
    variables
  );
