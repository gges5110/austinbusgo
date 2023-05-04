import { Divider, List, ListItem, ListItemText, Skeleton } from "@mui/material";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import * as React from "react";
import { ArrivalTime } from "../../../../interfaces/interface.d";
import { ArrivalTimeListItem } from "./ArrivalTimeListItem";
import { ArrivalTimesQuery } from "../../../../schemas/ArrivalTimes.generated";

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

export interface ArrivalTimeListProps {
  readonly arrivalTimes?: ArrivalTimesQuery["arrivalTimes"];
  readonly loading: boolean;
  selectedRouteIds: string[];

  arrivalTimeOnClick(arrivalTime: ArrivalTime): void;
}

export const ArrivalTimeList: React.FunctionComponent<ArrivalTimeListProps> = ({
  arrivalTimes,
  loading,
  arrivalTimeOnClick,
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
      arrivalTimes?.map((arrivalTime, index) => {
        return (
          <>
            {selectedRouteIds.includes(arrivalTime.trip.routeId) && (
              <div key={index}>
                <ArrivalTimeListItem
                  key={arrivalTime.trip.tripId}
                  arrivalTime={arrivalTime}
                  arrivalTimeOnClick={arrivalTimeOnClick}
                />
                <Divider />
              </div>
            )}
          </>
        );
      })
    )}
  </List>
);
