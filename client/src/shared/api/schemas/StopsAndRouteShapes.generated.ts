import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { graphQLEndpoint } from "config/config";
import * as Types from "shared/types/interface.d";

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
  routeId: Types.Scalars["String"]["input"];
  directionId: Types.Scalars["Int"]["input"];
  date: Types.Scalars["String"]["input"];
}>;

export type StopsAndShapesQuery = {
  __typename?: "Query";
  stopsAndShapes: {
    __typename?: "StopsAndShapes";
    stops: Array<{
      __typename?: "Stop";
      stopId: string;
      stopCode?: string | null;
      stopName?: string | null;
      stopLoc?: {
        __typename?: "Point";
        type: Types.GeometryType;
        coordinates: Array<number>;
      } | null;
      routes?: Array<{
        __typename?: "Route";
        routeId: string;
        routeColor?: string | null;
      }> | null;
    }>;
    shapes: Array<{
      __typename?: "LineString";
      type: Types.GeometryType;
      coordinates: Array<Array<number>>;
    }>;
  };
  distinctTrips: Array<{
    __typename?: "Trip";
    tripId: string;
    tripShortName?: string | null;
    directionId?: number | null;
  }>;
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
      routes {
        routeId
        routeColor
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
  TError = unknown,
>(
  variables: StopsAndShapesQueryVariables,
  options?: UseQueryOptions<StopsAndShapesQuery, TError, TData>
) => {
  return useQuery<StopsAndShapesQuery, TError, TData>(
    ["StopsAndShapes", variables],
    fetcher<StopsAndShapesQuery, StopsAndShapesQueryVariables>(
      StopsAndShapesDocument,
      variables
    ),
    options
  );
};

useStopsAndShapesQuery.getKey = (variables: StopsAndShapesQueryVariables) => [
  "StopsAndShapes",
  variables,
];

useStopsAndShapesQuery.fetcher = (variables: StopsAndShapesQueryVariables) =>
  fetcher<StopsAndShapesQuery, StopsAndShapesQueryVariables>(
    StopsAndShapesDocument,
    variables
  );
