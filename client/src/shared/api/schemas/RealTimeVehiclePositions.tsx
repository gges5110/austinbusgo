import { gql } from "graphql-request";

export const REAL_TIME_VEHICLE_POSITIONS_QUERY = gql`
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
