import { gql } from "@apollo/client";

export const DISTINCT_TRIPS_QUERY = gql`
  query DistinctTrips($routeId: String!) {
    distinctTrips(routeId: $routeId) {
      tripId
      tripShortName
      directionId
    }
  }
`;
