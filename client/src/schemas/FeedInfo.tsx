import { gql } from "graphql-request";

export const FEED_INFO_QUERY = gql`
  query FeedInfo {
    feedInfo {
      feedStartDate
      feedEndDate
      feedVersion
    }
  }
`;
