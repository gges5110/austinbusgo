import { gql } from "@apollo/client";

export const TRIPS_QUERY = gql`
  query Trips {
    trips {
      routeLongName
      routeId
      direction
      color
      tripId
      running
      dirAbbr
    }
  }
`;
