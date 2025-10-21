import * as Types from "../../types/interface.d";

import { graphQLEndpoint } from "../../../config/config";
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

export type StopsAndShapesQueryVariables = Types.Exact<{
  routeId: Types.Scalars["String"];
  directionId: Types.Scalars["Int"];
  date: Types.Scalars["String"];
}>;

export type StopsAndShapesQuery = { __typename?: "Query" } & {
  stopsAndShapes: { __typename?: "StopsAndShapes" } & {
    stops: Array<
      { __typename?: "Stop" } & Pick<
        Types.Stop,
        "stopId" | "stopCode" | "stopName"
      > & {
          stopLoc?: Types.Maybe<
            { __typename?: "Point" } & Pick<Types.Point, "type" | "coordinates">
          >;
        }
    >;
    shapes: Array<
      { __typename?: "LineString" } & Pick<
        Types.LineString,
        "type" | "coordinates"
      >
    >;
  };
  distinctTrips: Array<
    { __typename?: "Trip" } & Pick<
      Types.Trip,
      "tripId" | "tripShortName" | "directionId"
    >
  >;
};

export const StopsAndShapesDocument = `
    query StopsAndShapes($routeId: String!, $directionId: Int!, $date: String!) {
  stopsAndShapes(routeId: $routeId, directionId: $directionId, date: $date) {
    stops {
      stopId
      stopCode
      stopName
      stopLoc {
        type
        coordinates
      }
    }
    shapes {
      type
      coordinates
    }
  }
  distinctTrips(routeId: $routeId, date: $date) {
    tripId
    tripShortName
    directionId
  }
}
    `;
export const useStopsAndShapesQuery = <
  TData = StopsAndShapesQuery,
  TError = unknown
>(
  variables: StopsAndShapesQueryVariables,
  options?: UseQueryOptions<StopsAndShapesQuery, TError, TData>
) =>
  useQuery<StopsAndShapesQuery, TError, TData>(
    ["StopsAndShapes", variables],
    fetcher<StopsAndShapesQuery, StopsAndShapesQueryVariables>(
      StopsAndShapesDocument,
      variables
    ),
    options
  );

useStopsAndShapesQuery.getKey = (variables: StopsAndShapesQueryVariables) => [
  "StopsAndShapes",
  variables,
];
useStopsAndShapesQuery.fetcher = (variables: StopsAndShapesQueryVariables) =>
  fetcher<StopsAndShapesQuery, StopsAndShapesQueryVariables>(
    StopsAndShapesDocument,
    variables
  );
