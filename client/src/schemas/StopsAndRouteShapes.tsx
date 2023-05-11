import { gql } from "@apollo/client";

export const STOPS_AND_ROUTE_SHAPES_QUERY = gql`
  query StopsAndShapes($routeId: String!, $directionId: Int!, $date: String!) {
    stopsAndShapes(routeId: $routeId, directionId: $directionId, date: $date) {
      stops {
        stopId
        stopCode
        stopName
        stopLoc {
          type
          coordinates
        }
      }
      shapes {
        type
        coordinates
      }
    }
    distinctTrips(routeId: $routeId, date: $date) {
      tripId
      tripShortName
      directionId
    }
  }
`;
