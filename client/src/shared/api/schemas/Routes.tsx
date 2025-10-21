import { gql } from "graphql-request";

export const ROUTES_QUERY = gql`
  query Routes {
    routes {
      routeLongName
      routeId
      routeColor
    }
  }
`;
