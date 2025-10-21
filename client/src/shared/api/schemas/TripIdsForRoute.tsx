import { gql } from "graphql-request";

export const TRIP_IDS_FOR_ROUTE_QUERY = gql`
  query TripIdsForRoute($routeId: String!, $date: String!) {
    tripIdsForRoute(routeId: $routeId, date: $date) {
      tripIds
    }
  }
`;
