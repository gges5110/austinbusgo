import { gql } from "graphql-request";

export const EARLIEST_ARRIVAL_TIMES_ON_ROUTE_QUERY = gql`
  query EarliestArrivalTimesOnRoute(
    $routeId: String!
    $directionId: Int!
    $date: String!
    $time: String!
  ) {
    earliestArrivalTimesOnRoute(
      routeId: $routeId
      directionId: $directionId
      date: $date
      time: $time
    ) {
      stopSequence
      stopId
      scheduledArrivalTime
      updatedArrivalTime
      tripId
    }
  }
`;
