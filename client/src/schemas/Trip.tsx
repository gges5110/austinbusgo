import { gql } from "graphql-request";

export const TRIP_QUERY = gql`
  query Trip($tripId: String!) {
    trip(tripId: $tripId) {
      routeId
      serviceId
      tripId
      tripHeadsign
      tripShortName
      directionId
      blockId
      shapeId
      wheelchairAccessible
      bikesAllowed
      route {
        routeId
        routeLongName
        routeColor
      }
    }
  }
`;
