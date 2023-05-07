import { gql } from "@apollo/client";

export const SEARCH_QUERY = gql`
  query Search($searchTerm: String!) {
    search(searchTerm: $searchTerm) {
      stops {
        stopId
        stopName
      }
      routes {
        routeId
        routeLongName
        routeShortName
        routeColor
      }
    }
  }
`;
