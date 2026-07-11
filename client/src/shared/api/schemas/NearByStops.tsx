import { gql } from "graphql-request";

export const NEAR_BY_STOPS_QUERY = gql`
  query NearByStops(
    $minLat: Float!
    $minLon: Float!
    $maxLat: Float!
    $maxLon: Float!
    $limit: Int
  ) {
    nearByStops(
      minLat: $minLat
      minLon: $minLon
      maxLat: $maxLat
      maxLon: $maxLon
      limit: $limit
    ) {
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
