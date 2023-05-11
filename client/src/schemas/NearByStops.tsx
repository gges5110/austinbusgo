import { gql } from "@apollo/client";

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
    }
  }
`;
