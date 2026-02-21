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

export type RealTimeVehiclePositionsQuery = {
  __typename?: "Query";
  realTimeVehiclePositions: Array<{
    __typename?: "VehiclePosition";
    stopId?: string | null;
    currentStatus?: Types.VehicleStopStatus | null;
    timestamp?: number | null;
    congestionLevel?: number | null;
    currentStopSequence?: number | null;
    trip?: {
      __typename?: "TripDescriptor";
      tripId?: string | null;
      routeId?: string | null;
      startDate?: string | null;
      startTime?: string | null;
    } | null;
    vehicle?: {
      __typename?: "VehicleDescriptor";
      id?: string | null;
      label?: string | null;
      licensePlate?: string | null;
    } | null;
    position?: {
      __typename?: "Position";
      latitude: number;
      longitude: number;
      bearing?: number | null;
      speed?: number | null;
    } | null;
  } | null>;
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
  TError = unknown,
>(
  variables?: RealTimeVehiclePositionsQueryVariables,
  options?: UseQueryOptions<RealTimeVehiclePositionsQuery, TError, TData>
) => {
  return useQuery<RealTimeVehiclePositionsQuery, TError, TData>(
    variables === undefined
      ? ["RealTimeVehiclePositions"]
      : ["RealTimeVehiclePositions", variables],
    fetcher<
      RealTimeVehiclePositionsQuery,
      RealTimeVehiclePositionsQueryVariables
    >(RealTimeVehiclePositionsDocument, variables),
    options
  );
};

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
