import { gql } from "graphql-request";

export const VEHICLE_POSITIONS_QUERY = gql`
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
