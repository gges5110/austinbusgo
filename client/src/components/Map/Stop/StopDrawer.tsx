import {
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
} from "@material-ui/core";
import PlaceIcon from "@material-ui/icons/Place";
import { Alert } from "@material-ui/lab";
import * as React from "react";
import {
  ArrivalTime,
  RunningTrip,
  Stop,
} from "../../../interfaces/interface.d";
import { useArrivalTimesQuery } from "../../../schemas/ArrivalTimes.generated";
import { ArrivalTimeList } from "../../ArrivalTimeList";

interface StopDrawerProps {
  readonly stop: Stop;
  readonly runningTrip: RunningTrip;
  onClose(): void;
  arrivalTimeOnClick(arrivalTime: ArrivalTime): void;
}

export const StopDrawer: React.FunctionComponent<StopDrawerProps> = ({
  onClose,
  runningTrip,
  stop,
  arrivalTimeOnClick,
}) => {
  const { loading, data, error } = useArrivalTimesQuery({
    fetchPolicy: "network-only",
    variables: {
      stopId: String(stop.stopId),
      direction: runningTrip.direction,
      routeId: Number(runningTrip.routeId),
    },
  });

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={true}
      onClose={onClose}
      disableBackdropTransition={true}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onOpen={() => {}}
    >
      <List>
        <ListItem button={true}>
          <ListItemIcon>
            <PlaceIcon />
          </ListItemIcon>
          <ListItemText primary={stop.stopName} />
          {loading && <CircularProgress />}
        </ListItem>
      </List>

      <Divider />
      {error && <Alert severity="error">An error happened on query!</Alert>}
      <ArrivalTimeList
        arrivalTimes={data?.arrivalTimes || []}
        arrivalTimeOnClick={arrivalTimeOnClick}
        loading={loading}
      />
    </SwipeableDrawer>
  );
};
