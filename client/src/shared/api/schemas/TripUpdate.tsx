import { gql } from "graphql-request";

export const TRIP_UPDATE_QUERY = gql`
  query TripUpdate($tripId: String!) {
    tripUpdate(tripId: $tripId) {
      trip {
        tripId
        startDate
        startTime
        routeId
      }
      stopTimeUpdate {
        stopId
        stopSequence
        arrival {
          time
          delay
        }
        departure {
          time
          delay
        }
      }
    }
  }
`;
