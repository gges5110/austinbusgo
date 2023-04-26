import { gql } from "@apollo/client";

export const TRIPS_QUERY = gql`
  query Trips($date: String!) {
    trips(date: $date) {
      routeLongName
      routeId
      direction
      color
      running
      dirAbbr
    }
  }
`;
