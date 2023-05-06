import { gql } from "@apollo/client";

export const DISTINCT_TRIPS_QUERY = gql`
  query DistinctTrips($routeId: String!, $date: String!) {
    distinctTrips(routeId: $routeId, date: $date) {
      tripId
      tripShortName
      directionId
    }
  }
`;
