import { Divider, List, ListItem, ListItemText, Skeleton } from "@mui/material";
import * as React from "react";
import { ArrivalTime, Stop } from "shared/api/generated/model";

import { ArrivalTimeListItem } from "./ArrivalTimeListItem";

export interface ArrivalTimeListProps {
  arrivalTimes?: ArrivalTime[];
  loading: boolean;
  selectedRouteIds: string[];
  stop: Stop;
}

export const ArrivalTimeList: React.FunctionComponent<ArrivalTimeListProps> = ({
  arrivalTimes,
  loading,
  stop,
  selectedRouteIds,
}) => (
  <List aria-live={"polite"} aria-relevant={"additions removals"}>
    {loading ? (
      <ListItem key={"loading"}>
        <ListItemText primary={<Skeleton height={56} />} />
      </ListItem>
    ) : arrivalTimes?.length === 0 ? (
      <ListItem key={"no-more-buses"}>
        <ListItemText primary={"No more running buses"} />
      </ListItem>
    ) : (
      arrivalTimes?.map((arrivalTime) =>
        selectedRouteIds.includes(arrivalTime.trip.routeId) ? (
          <React.Fragment key={arrivalTime.trip.tripId}>
            <ArrivalTimeListItem arrivalTime={arrivalTime} stop={stop} />
            <Divider />
          </React.Fragment>
        ) : null
      )
    )}
  </List>
);
