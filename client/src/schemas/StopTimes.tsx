import { gql } from "graphql-request";

export const STOP_TIMES_QUERY = gql`
  query StopTimes($tripId: String!) {
    stopTimes(tripId: $tripId) {
      tripId
      arrivalTime
      departureTime
      stopId
      stopSequence
      stop {
        stopName
      }
    }
  }
`;
