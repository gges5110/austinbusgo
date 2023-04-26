import {
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  SwipeableDrawer,
  useMediaQuery,
} from "@material-ui/core";
import PlaceIcon from "@material-ui/icons/Place";
import { Alert } from "@material-ui/lab";
import * as React from "react";
import { ArrivalTime, Stop } from "../../../interfaces/interface.d";
import { useArrivalTimesQuery } from "../../../schemas/ArrivalTimes.generated";
import { ArrivalTimeList } from "../../ArrivalTimeList";
import { theme } from "../../../App";
import { useAtomValue } from "jotai";
import { selectedRouteAtom } from "../../../Atoms";

interface StopDrawerProps {
  readonly stop: Stop;
  onClose(): void;
  arrivalTimeOnClick(arrivalTime: ArrivalTime): void;
}

export const getDate = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    ("0" + (d.getMonth() + 1)).slice(-2),
    ("0" + d.getDate()).slice(-2),
  ].join("");
};

export const StopDrawer: React.FunctionComponent<StopDrawerProps> = ({
  onClose,
  stop,
  arrivalTimeOnClick,
}) => {
  const runningTrip = useAtomValue(selectedRouteAtom);
  const { loading, data, error } = useArrivalTimesQuery({
    fetchPolicy: "network-only",
    variables: {
      stopId: String(stop.stopId),
      direction: runningTrip?.direction || false,
      routeId: Number(runningTrip?.routeId),
      date: getDate(),
    },
  });
  const matches = useMediaQuery(theme.breakpoints.up("sm"));

  return (
    <SwipeableDrawer
      anchor={matches ? "right" : "bottom"}
      hideBackdrop={matches}
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
