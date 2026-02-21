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
export type TripUpdateQueryVariables = Types.Exact<{
  tripId: Types.Scalars["String"]["input"];
}>;

export type TripUpdateQuery = {
  __typename?: "Query";
  tripUpdate?: {
    __typename?: "TripUpdate";
    trip: {
      __typename?: "TripDescriptor";
      tripId?: string | null;
      startDate?: string | null;
      startTime?: string | null;
      routeId?: string | null;
    };
    stopTimeUpdate: Array<{
      __typename?: "StopTimeUpdate";
      stopId?: string | null;
      stopSequence?: number | null;
      arrival?: {
        __typename?: "StopTimeEvent";
        time?: number | null;
        delay?: number | null;
      } | null;
      departure?: {
        __typename?: "StopTimeEvent";
        time?: number | null;
        delay?: number | null;
      } | null;
    } | null>;
  } | null;
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
) => {
  return useQuery<TripUpdateQuery, TError, TData>(
    ["TripUpdate", variables],
    fetcher<TripUpdateQuery, TripUpdateQueryVariables>(
      TripUpdateDocument,
      variables
    ),
    options
  );
};

useTripUpdateQuery.getKey = (variables: TripUpdateQueryVariables) => [
  "TripUpdate",
  variables,
];

useTripUpdateQuery.fetcher = (variables: TripUpdateQueryVariables) =>
  fetcher<TripUpdateQuery, TripUpdateQueryVariables>(
    TripUpdateDocument,
    variables
  );
