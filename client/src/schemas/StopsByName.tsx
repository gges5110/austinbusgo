import { gql } from "graphql-request";

export const STOPS_BY_NAME_QUERY = gql`
  query StopsByName($stopName: String!) {
    stopsByName(stopName: $stopName) {
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
