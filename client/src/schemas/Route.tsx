import { gql } from "@apollo/client";

export const ROUTE_QUERY = gql`
  query Route($routeId: Int!) {
    route(routeId: $routeId) {
      routeLongName
      routeId
      routeColor
    }
  }
`;
