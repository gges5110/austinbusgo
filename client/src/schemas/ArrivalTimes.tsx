import { gql } from "@apollo/client";

export const ARRIVAL_TIMES_QUERY = gql`
  query ArrivalTimes(
    $routeId: Int!
    $direction: Boolean!
    $stopId: String!
    $date: String!
  ) {
    arrivalTimes(
      routeId: $routeId
      direction: $direction
      stopId: $stopId
      date: $date
    ) {
      updatedArrivalTime
      scheduledArrivalTime
      trip {
        routeId
        serviceId
        tripId
        tripHeadsign
        tripShortName
        directionId
        blockId
        shapeId
        wheelchairAccessible
        bikesAllowed
      }
      vehicle {
        trip {
          tripId
          routeId
          startDate
        }
        vehicle {
          id
          label
        }
        position {
          latitude
          longitude
        }
        stopId
        currentStatus
        timestamp
      }
    }
  }
`;
