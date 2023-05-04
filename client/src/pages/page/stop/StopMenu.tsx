import { useNavigate, useParams } from "react-router-dom";
import { Paper, Slide } from "@mui/material";
import * as React from "react";
import { StopInfoAndArrivalTimes } from "../../../components/Stop/StopInfoAndArrivalTimes/StopInfoAndArrivalTimes";
import { useTitle } from "../../../hooks/UseTitle";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";
import { client, useDataFromLoader } from "../../../Router";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  StopDocument,
  StopQuery,
  StopQueryVariables,
} from "../../../schemas/Stop.generated";
import { SEARCH_PANEL_WIDTH } from "../../../components/Route/SearchPanel";

interface StopMenuProps {
  hideBackButton?: boolean;
}

export const stopLoader = async ({ params }: LoaderFunctionArgs) => {
  const stopId = params["stopId"];
  return await client.query<StopQuery, StopQueryVariables>({
    query: StopDocument,
    variables: {
      stopId: stopId || "0",
    },
  });
};
export const StopMenu: React.FC<StopMenuProps> = ({ hideBackButton }) => {
  const navigate = useNavigate();
  const { routeId } = useParams();
  const {
    data: { stop },
  } = useDataFromLoader(stopLoader);
  useTitle(`${stop.stopName} - Austin Bus Go`);
  const { viewStatePathname } = useViewStatePathname();

  return (
    <Paper
      sx={{
        maxHeight: "80vh",
        width: SEARCH_PANEL_WIDTH,
        m: 4,
        mt: 2,
        overflow: "hidden",
        borderRadius: 2.5,
      }}
    >
      <Slide direction="right" in={true} mountOnEnter unmountOnExit>
        <div>
          <StopInfoAndArrivalTimes
            stop={stop}
            routeId={routeId}
            onBack={() => {
              navigate(-1);
            }}
            arrivalTimeOnClick={(arrivalTime) => {
              navigate(
                `${viewStatePathname}/routes/${
                  arrivalTime.trip.routeId
                }/direction/${arrivalTime.trip.directionId ? 1 : 0}/stops/${
                  stop.stopId
                }/trips/${arrivalTime.trip.tripId}`
              );
            }}
            hideBackButton={hideBackButton}
          />
        </div>
      </Slide>
    </Paper>
  );
};
