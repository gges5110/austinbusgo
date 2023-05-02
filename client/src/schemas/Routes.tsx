import { gql } from "@apollo/client";

export const ROUTES_QUERY = gql`
  query Routes {
    routes {
      routeLongName
      routeId
      routeColor
    }
  }
`;
