import { gql } from "graphql-request";

export const NEAR_BY_STOPS_QUERY = gql`
  query NearByStops($lat: Float!, $lon: Float!) {
    nearByStops(lat: $lat, lon: $lon) {
      stopId
      stopCode
      stopName
      stopLoc {
        type
        coordinates
      }
      routes {
        routeId
        routeColor
        routeLongName
      }
    }
  }
`;
