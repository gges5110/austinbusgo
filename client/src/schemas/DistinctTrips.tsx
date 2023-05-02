import { gql } from "@apollo/client";

export const DISTINCT_TRIPS_QUERY = gql`
  query DistinctTrips($routeId: Int!) {
    distinctTrips(routeId: $routeId) {
      tripId
      tripShortName
      directionId
    }
  }
`;
