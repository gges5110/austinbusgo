import { gql } from "graphql-request";

export const NEAR_BY_STOPS_QUERY = gql`
  query NearByStops(
    $lat: Float!
    $lon: Float!
    $radius: Float
    $limit: Int
    $minLat: Float
    $minLon: Float
    $maxLat: Float
    $maxLon: Float
  ) {
    nearByStops(
      lat: $lat
      lon: $lon
      radius: $radius
      limit: $limit
      minLat: $minLat
      minLon: $minLon
      maxLat: $maxLat
      maxLon: $maxLon
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
