import { gql } from "graphql-request";

export const ALL_STOPS_QUERY = gql`
  query AllStops {
    stops {
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
