import { gql } from "@apollo/client";

export const RUNNING_TRIPS_QUERY = gql`
  query RunningTrips($filterInput: RunningTripFilterInput) {
    runningTrips(filterInput: $filterInput) {
      name
      routeId
      direction
      color
      tripId
    }
  }
`;
