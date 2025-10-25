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
export type RealTimeVehiclePositionsQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type RealTimeVehiclePositionsQuery = { __typename?: "Query" } & {
  realTimeVehiclePositions: Array<
    Types.Maybe<
      { __typename?: "VehiclePosition" } & Pick<
        Types.VehiclePosition,
        | "stopId"
        | "currentStatus"
        | "timestamp"
        | "congestionLevel"
        | "currentStopSequence"
      > & {
          trip?: Types.Maybe<
            { __typename?: "TripDescriptor" } & Pick<
              Types.TripDescriptor,
              "tripId" | "routeId" | "startDate" | "startTime"
            >
          >;
          vehicle?: Types.Maybe<
            { __typename?: "VehicleDescriptor" } & Pick<
              Types.VehicleDescriptor,
              "id" | "label" | "licensePlate"
            >
          >;
          position?: Types.Maybe<
            { __typename?: "Position" } & Pick<
              Types.Position,
              "latitude" | "longitude" | "bearing" | "speed"
            >
          >;
        }
    >
  >;
};

export const RealTimeVehiclePositionsDocument = `
    query RealTimeVehiclePositions {
  realTimeVehiclePositions {
    trip {
      tripId
      routeId
      startDate
      startTime
    }
    vehicle {
      id
      label
      licensePlate
    }
    position {
      latitude
      longitude
      bearing
      speed
    }
    stopId
    currentStatus
    timestamp
    congestionLevel
    currentStopSequence
  }
}
    `;
export const useRealTimeVehiclePositionsQuery = <
  TData = RealTimeVehiclePositionsQuery,
  TError = unknown
>(
  variables?: RealTimeVehiclePositionsQueryVariables,
  options?: UseQueryOptions<RealTimeVehiclePositionsQuery, TError, TData>
) =>
  useQuery<RealTimeVehiclePositionsQuery, TError, TData>(
    variables === undefined
      ? ["RealTimeVehiclePositions"]
      : ["RealTimeVehiclePositions", variables],
    fetcher<
      RealTimeVehiclePositionsQuery,
      RealTimeVehiclePositionsQueryVariables
    >(RealTimeVehiclePositionsDocument, variables),
    options
  );

useRealTimeVehiclePositionsQuery.getKey = (
  variables?: RealTimeVehiclePositionsQueryVariables
) =>
  variables === undefined
    ? ["RealTimeVehiclePositions"]
    : ["RealTimeVehiclePositions", variables];
useRealTimeVehiclePositionsQuery.fetcher = (
  variables?: RealTimeVehiclePositionsQueryVariables
) =>
  fetcher<
    RealTimeVehiclePositionsQuery,
    RealTimeVehiclePositionsQueryVariables
  >(RealTimeVehiclePositionsDocument, variables);
