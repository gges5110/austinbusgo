import { gql } from "@apollo/client";

export const STOPS_AND_ROUTE_SHAPES_QUERY = gql`
  query StopsAndShapes(
    $routeId: String!
    $directionId: Boolean!
    $date: String!
  ) {
    stopsAndShapes(routeId: $routeId, directionId: $directionId, date: $date) {
      stops {
        stopId
        stopCode
        stopName
        stopLat
        stopLon
      }
      shapes {
        shapePtLat
        shapePtLon
      }
    }
  }
`;
