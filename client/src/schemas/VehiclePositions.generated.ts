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

export type VehiclePositionsQueryVariables = Types.Exact<{
  routeId: Types.Scalars["String"];
  direction: Types.Scalars["Int"];
}>;

export type VehiclePositionsQuery = { __typename?: "Query" } & {
  vehiclePositions?: Types.Maybe<
    Array<
      { __typename?: "VehiclePosition" } & Pick<
        Types.VehiclePosition,
        "stopId" | "currentStatus" | "timestamp" | "congestionLevel"
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
  }
}
    `;
export const useVehiclePositionsQuery = <
  TData = VehiclePositionsQuery,
  TError = unknown
>(
  variables: VehiclePositionsQueryVariables,
  options?: UseQueryOptions<VehiclePositionsQuery, TError, TData>
) =>
  useQuery<VehiclePositionsQuery, TError, TData>(
    ["VehiclePositions", variables],
    fetcher<VehiclePositionsQuery, VehiclePositionsQueryVariables>(
      VehiclePositionsDocument,
      variables
    ),
    options
  );

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
