import { gql } from "graphql-request";

export const STOPS_QUERY = gql`
  query Stops {
    stops {
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
