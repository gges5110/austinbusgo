import { gql } from "graphql-request";

export const STOP_QUERY = gql`
  query Stop($stopId: String!) {
    stop(stopId: $stopId) {
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
