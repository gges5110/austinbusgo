import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { DirectionToggle } from "../../components/Route/DirectionToggle/DirectionToggle";
import { StopsTimeline } from "../../components/Route/StopsTimeline/StopsTimeline";
import * as React from "react";
import { getDate } from "../RootLayout";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import { useTitle } from "../../hooks/UseTitle";
import { client, useDataFromLoader } from "../../Router";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  RouteDocument,
  RouteQuery,
  RouteQueryVariables,
} from "../../schemas/Route.generated";
import {
  StopsAndShapesDocument,
  StopsAndShapesQuery,
  StopsAndShapesQueryVariables,
} from "../../schemas/StopsAndRouteShapes.generated";
import RouteIcon from "@mui/icons-material/Route";
import { RouteIdDisplay } from "../../components/RouteIdDisplay/RouteIdDisplay";
import { Trip } from "../../interfaces/interface.d";
import { MenuPanel } from "../../components/MenuPanel";

export const routeLoader = async ({ params }: LoaderFunctionArgs) => {
  const routeId = params["routeId"] || "";
  const directionId = Number(params["directionId"]);

  const routeQuery = client.query<RouteQuery, RouteQueryVariables>({
    query: RouteDocument,
    variables: {
      routeId,
    },
  });
  const stopsAndShapesQuery = client.query<
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
  const { data: routeData } = await routeQuery;
  const { data: stopsAndShapesData } = await stopsAndShapesQuery;

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

  const setDirection = (directionId: Trip["directionId"]) => {
    if (directionId) {
      navigate(
        `${viewStatePathname}/routes/${routeId}/direction/${directionId}`,
        {
          replace: true,
        }
      );
    }
  };

  return (
    <MenuPanel>
      <Box
        sx={{
          py: 1,
          boxShadow: 2,
          width: "100%",
        }}
      >
        <Box
          component={"div"}
          display={"flex"}
          gap={1}
          justifyContent={"center"}
          sx={{ py: 1 }}
        >
          <RouteIcon />
          <RouteIdDisplay
            routeColor={route.routeColor}
            routeId={route.routeId}
          />
          <Typography sx={{ fontSize: "18px" }}>
            {route.routeLongName}
          </Typography>
        </Box>
        <Box sx={{ pl: 4 }}>
          <DirectionToggle
            directionId={Number(directionId)}
            setDirection={setDirection}
            distinctTrips={distinctTrips}
          />
        </Box>
      </Box>

      <Box sx={{}}>
        <StopsTimeline
          stops={stops}
          setSelectedStopId={(stopId) => {
            navigate(
              `${viewStatePathname}/routes/${routeId}/direction/${directionId}/stops/${stopId}`
            );
          }}
        />
      </Box>
    </MenuPanel>
  );
};
