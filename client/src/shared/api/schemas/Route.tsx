import { gql } from "graphql-request";

export const ROUTE_QUERY = gql`
  query Route($routeId: String!) {
    route(routeId: $routeId) {
      routeLongName
      routeId
      routeColor
    }
  }
`;
