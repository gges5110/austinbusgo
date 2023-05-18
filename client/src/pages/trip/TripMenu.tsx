import { useNavigate, useParams } from "react-router-dom";
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
import { useRef } from "react";
import { TripTimeline } from "../../components/Trip/TripTimeline/TripTimeline";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import { RouteIdDisplay } from "../../components/RouteIdDisplay/RouteIdDisplay";
import { useDataFromLoader, useDataFromRouteLoader } from "../../Router";
import { MenuPanel } from "../../components/MenuPanel";
import { useTitle } from "../../hooks/UseTitle";
import { stopLoader } from "../stop/StopLoader";
import { tripLoader } from "./TripLoader";
import { searchParamsDataLoader } from "../SearchParamsDataLoader";
import { useTripUpdateQuery } from "../../schemas/TripUpdate.generated";

export const TripMenu = () => {
  const { trip, stopTimes, tripUpdate } = useDataFromLoader(tripLoader);
  const stopData = useDataFromRouteLoader("stop", stopLoader);
  const stop = stopData?.stop;

  const params = useParams();
  const tripId = params["tripId"];

  useTripUpdateQuery(
    {
      tripId: tripId || "",
    },
    {
      refetchInterval: 15000,
    }
  );

  const searchParamsData = useDataFromRouteLoader(
    "searchParams",
    searchParamsDataLoader
  );
  const vehiclePosition = searchParamsData?.vehiclePositions?.find(
    (v) => v.trip?.tripId === trip.tripId
  );

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

  useTitle(`${tripName} - Austin Bus Go`);

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
              {"from "}
              {stop?.stopName}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ width: "100%", display: "none" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label={"basic tabs example"}
            >
              <Tab label={"Item One"} />
              <Tab label={"Item Two"} />
              <Tab label={"Item Three"} />
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
          vehiclePosition={vehiclePosition}
          tripUpdate={tripUpdate}
          stopTimes={stopTimes}
          stop={stop}
          trip={trip}
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
      role={"tabpanel"}
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
