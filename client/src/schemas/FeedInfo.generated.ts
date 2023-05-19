import * as Types from "../interfaces/interface.d";

import { graphQLEndpoint } from "../config";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

function fetcher<TData, TVariables>(query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(graphQLEndpoint as string, {
      method: "POST",
      ...{ headers: { "Content-Type": "application/json" } },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  };
}
export type FeedInfoQueryVariables = Types.Exact<{ [key: string]: never }>;

export type FeedInfoQuery = { __typename?: "Query" } & {
  feedInfo: { __typename?: "FeedInfo" } & Pick<
    Types.FeedInfo,
    "feedStartDate" | "feedEndDate" | "feedVersion"
  >;
};

export const FeedInfoDocument = `
    query FeedInfo {
  feedInfo {
    feedStartDate
    feedEndDate
    feedVersion
  }
}
    `;
export const useFeedInfoQuery = <TData = FeedInfoQuery, TError = unknown>(
  variables?: FeedInfoQueryVariables,
  options?: UseQueryOptions<FeedInfoQuery, TError, TData>
) =>
  useQuery<FeedInfoQuery, TError, TData>(
    variables === undefined ? ["FeedInfo"] : ["FeedInfo", variables],
    fetcher<FeedInfoQuery, FeedInfoQueryVariables>(FeedInfoDocument, variables),
    options
  );

useFeedInfoQuery.getKey = (variables?: FeedInfoQueryVariables) =>
  variables === undefined ? ["FeedInfo"] : ["FeedInfo", variables];
useFeedInfoQuery.fetcher = (variables?: FeedInfoQueryVariables) =>
  fetcher<FeedInfoQuery, FeedInfoQueryVariables>(FeedInfoDocument, variables);
