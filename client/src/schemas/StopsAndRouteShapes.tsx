import { gql } from "@apollo/client";

export const STOPS_AND_ROUTE_SHAPES_QUERY = gql`
  query Stops($tripId: String!) {
    stops(tripId: $tripId) {
      stopId
      stopCode
      stopName
      stopLat
      stopLon
    }

    routeShapes(tripId: $tripId) {
      shapePtLat
      shapePtLon
    }
  }
`;
