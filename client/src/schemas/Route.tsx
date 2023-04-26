import { gql } from "@apollo/client";

export const ROUTE_QUERY = gql`
  query Route($routeId: String!) {
    route(routeId: $routeId) {
      routeLongName
      routeId
      routeColor
    }
  }
`;
