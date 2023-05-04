import { useNavigate, useParams } from "react-router-dom";
import { Box, Slide, Paper } from "@mui/material";
import { DirectionToggle } from "../../../../components/Route/DirectionToggle/DirectionToggle";
import { StopsTimeline } from "../../../../components/Route/StopsTimeline/StopsTimeline";
import * as React from "react";
import { getDate, toBoolean } from "../../RootLayout";
import { useViewStatePathname } from "../../../../hooks/UseViewStatePathname";
import { useTitle } from "../../../../hooks/UseTitle";
import { client, useDataFromLoader } from "../../../../Router";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  RouteDocument,
  RouteQuery,
  RouteQueryVariables,
} from "../../../../schemas/Route.generated";
import {
  StopsAndShapesDocument,
  StopsAndShapesQuery,
  StopsAndShapesQueryVariables,
} from "../../../../schemas/StopsAndRouteShapes.generated";

export const routeLoader = async ({ params }: LoaderFunctionArgs) => {
  const routeId = Number(params["routeId"]);
  const directionId = toBoolean(params["directionId"]);
  const { data: routeData } = await client.query<
    RouteQuery,
    RouteQueryVariables
  >({
    query: RouteDocument,
    variables: {
      routeId,
    },
  });

  const { data: stopsAndShapesData } = await client.query<
    StopsAndShapesQuery,
    StopsAndShapesQueryVariables
  >({
    query: StopsAndShapesDocument,
    variables: {
      routeId,
      directionId,
      date: getDate(),
    },
  });
  return {
    route: routeData.route,
    shapes: stopsAndShapesData.stopsAndShapes.shapes,
    stops: stopsAndShapesData.stopsAndShapes.stops,
    distinctTrips: stopsAndShapesData.distinctTrips,
  };
};
export const RouteMenu = () => {
  const navigate = useNavigate();
  const { stops, distinctTrips, route } = useDataFromLoader(routeLoader);
  const { routeId, directionId } = useParams();

  const { viewStatePathname } = useViewStatePathname();

  useTitle(`${route.routeId} ${route.routeLongName} - Austin Bus Go`);
  return (
    <Paper
      sx={{
        maxHeight: "80vh",
        width: "408px",
        m: 4,
        mt: 2,
        overflow: "hidden",
        borderRadius: 2.5,
      }}
    >
      <Slide direction="right" in={true} mountOnEnter unmountOnExit>
        <div>
          <Box
            sx={{
              py: 1,
              pl: 4,
              boxShadow: 2,
              width: "100%",
            }}
          >
            <DirectionToggle
              direction={toBoolean(directionId)}
              setDirection={(direction) => {
                navigate(
                  `${viewStatePathname}/routes/${routeId}/direction/${
                    direction ? 1 : 0
                  }`,
                  {
                    replace: true,
                  }
                );
              }}
              distinctTrips={distinctTrips}
            />
          </Box>

          <Box sx={{ overflowY: "auto", maxHeight: "80vh" }}>
            <StopsTimeline
              stops={stops}
              setSelectedStopId={(stopId) => {
                navigate(
                  `${viewStatePathname}/routes/${routeId}/direction/${directionId}/stops/${stopId}`
                );
              }}
            />
          </Box>
        </div>
      </Slide>
    </Paper>
  );
};
