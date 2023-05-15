import { gql } from "graphql-request";

export const SEARCH_QUERY = gql`
  query Search($searchTerm: String!) {
    search(searchTerm: $searchTerm) {
      stops {
        stopId
        stopName
        routes {
          routeColor
          routeId
        }
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
