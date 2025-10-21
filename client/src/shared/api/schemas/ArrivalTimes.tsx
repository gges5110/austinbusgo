import { gql } from "graphql-request";

export const ARRIVAL_TIMES_QUERY = gql`
  query ArrivalTimes($stopId: String!, $date: String!) {
    arrivalTimes(stopId: $stopId, date: $date) {
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
        route {
          routeColor
          routeLongName
        }
      }
    }
  }
`;
