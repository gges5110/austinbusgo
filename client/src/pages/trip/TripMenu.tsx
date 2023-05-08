import { useMatches, useNavigate } from "react-router-dom";
import { Params } from "@remix-run/router";
import {
  Box,
  Divider,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import * as React from "react";
import { TripTimeline } from "../../components/Trip/TripTimeline/TripTimeline";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { RouteIdDisplay } from "../../components/RouteIdDisplay/RouteIdDisplay";
import { useViewStatePathname } from "../../hooks/UseViewStatePathname";
import { client, HandleType, useDataFromLoader } from "../../Router";
import { stopLoader } from "../stop/StopMenu";
import { LoaderFunctionArgs } from "@remix-run/router/utils";
import {
  StopTimesDocument,
  StopTimesQuery,
  StopTimesQueryVariables,
} from "../../schemas/StopTimes.generated";
import {
  TripDocument,
  TripQuery,
  TripQueryVariables,
} from "../../schemas/Trip.generated";
import { MenuPanel } from "../../components/MenuPanel";
import { useRef } from "react";

export const tripLoader = async ({ params }: LoaderFunctionArgs) => {
  const tripId = params["tripId"];
  const stopTimesQuery = client.query<StopTimesQuery, StopTimesQueryVariables>({
    query: StopTimesDocument,
    variables: {
      tripId: tripId || "",
    },
  });
  const tripQuery = client.query<TripQuery, TripQueryVariables>({
    query: TripDocument,
    variables: {
      tripId: tripId || "",
    },
  });

  const { data: stopTimesData } = await stopTimesQuery;
  const { data: tripData } = await tripQuery;

  return {
    trip: tripData.trip,
    stopTimes: stopTimesData.stopTimes,
  };
};
export const TripMenu = () => {
  const { trip, stopTimes } = useDataFromLoader(tripLoader);
  const { viewStatePathname } = useViewStatePathname();
  const matches = useMatches() as {
    id: string;
    pathname: string;
    params: Params;
    data: unknown;
    handle: HandleType;
  }[];
  const stop = matches
    .filter((match) => Boolean(match.handle?.stop))
    .map((match) =>
      match.handle?.stop?.(match.data as Awaited<ReturnType<typeof stopLoader>>)
    )[0];

  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };

  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const tripName = trip.tripHeadsign?.split("-")[
    trip.tripHeadsign?.split("-").length - 1
  ];

  const containerRef = useRef<HTMLDivElement | null>(null);
  return (
    <MenuPanel innerRef={containerRef}>
      <Box
        sx={{
          py: 1,
          boxShadow: 2,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            py: 1,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Tooltip title={"Back"} sx={{ position: "absolute", left: "6px" }}>
            <IconButton onClick={onBack}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              <DirectionsBusIcon />
              <RouteIdDisplay
                routeId={trip.routeId}
                routeColor={trip.route.routeColor}
              />
              <Typography sx={{ fontSize: "18px" }}>{tripName}</Typography>
            </Box>
            <Typography
              sx={{ color: "gray", textAlign: "center", fontSize: "16px" }}
            >
              from {stop?.stopName}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ width: "100%", display: "none" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
            >
              <Tab label="Item One" />
              <Tab label="Item Two" />
              <Tab label="Item Three" />
            </Tabs>
          </Box>
          <TabPanel value={value} index={0}>
            Item One
          </TabPanel>
          <TabPanel value={value} index={1}>
            Item Two
          </TabPanel>
          <TabPanel value={value} index={2}>
            Item Three
          </TabPanel>
        </Box>

        <Divider />
        <TripTimeline
          stopTimes={stopTimes}
          stop={stop}
          trip={trip}
          stopTimeOnClick={(stopTime) => {
            navigate(`${viewStatePathname}/stops/${stopTime.stopId}`);
          }}
          containerRef={containerRef}
        />
      </Box>
    </MenuPanel>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}
