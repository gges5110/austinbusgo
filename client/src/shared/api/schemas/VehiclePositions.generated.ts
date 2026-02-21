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
export type VehiclePositionsQueryVariables = Types.Exact<{
  routeId: Types.Scalars["String"]["input"];
  direction: Types.Scalars["Int"]["input"];
}>;

export type VehiclePositionsQuery = {
  __typename?: "Query";
  vehiclePositions: Array<{
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
  }>;
};

export const VehiclePositionsDocument = `
    query VehiclePositions($routeId: String!, $direction: Int!) {
  vehiclePositions(routeId: $routeId, direction: $direction) {
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

export const useVehiclePositionsQuery = <
  TData = VehiclePositionsQuery,
  TError = unknown,
>(
  variables: VehiclePositionsQueryVariables,
  options?: UseQueryOptions<VehiclePositionsQuery, TError, TData>
) => {
  return useQuery<VehiclePositionsQuery, TError, TData>(
    ["VehiclePositions", variables],
    fetcher<VehiclePositionsQuery, VehiclePositionsQueryVariables>(
      VehiclePositionsDocument,
      variables
    ),
    options
  );
};

useVehiclePositionsQuery.getKey = (
  variables: VehiclePositionsQueryVariables
) => ["VehiclePositions", variables];

useVehiclePositionsQuery.fetcher = (
  variables: VehiclePositionsQueryVariables
) =>
  fetcher<VehiclePositionsQuery, VehiclePositionsQueryVariables>(
    VehiclePositionsDocument,
    variables
  );
