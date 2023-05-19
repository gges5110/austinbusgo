import { Divider, List, ListItem, ListItemText, Skeleton } from "@mui/material";
import * as React from "react";
import { ArrivalTimeListItem } from "./ArrivalTimeListItem";
import { ArrivalTimesQuery } from "../../../schemas/ArrivalTimes.generated";
import { StopQuery } from "../../../schemas/Stop.generated";

export interface ArrivalTimeListProps {
  arrivalTimes?: ArrivalTimesQuery["arrivalTimes"];
  loading: boolean;
  selectedRouteIds: string[];
  stop: StopQuery["stop"];
}

export const ArrivalTimeList: React.FunctionComponent<ArrivalTimeListProps> = ({
  arrivalTimes,
  loading,
  stop,
  selectedRouteIds,
}) => (
  <List>
    {loading ? (
      <ListItem key={"loading"}>
        <ListItemText primary={<Skeleton height={56} />} />
      </ListItem>
    ) : arrivalTimes?.length === 0 ? (
      <ListItem key={"no-more-buses"}>
        <ListItemText primary={"No more running buses"} />
      </ListItem>
    ) : (
      arrivalTimes?.map((arrivalTime) => (
        <>
          {selectedRouteIds.includes(arrivalTime.trip.routeId) && (
            <div key={arrivalTime.trip.tripId}>
              <ArrivalTimeListItem
                arrivalTime={arrivalTime}
                key={arrivalTime.trip.tripId}
                stop={stop}
              />
              <Divider key={`${arrivalTime.trip.tripId}-divider`} />
            </div>
          )}
        </>
      ))
    )}
  </List>
);
