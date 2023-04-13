import { gql } from "@apollo/client";

export const VEHICLE_POSITIONS_QUERY = gql`
  query VehiclePositions($routeId: Int!, $direction: Boolean!) {
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
