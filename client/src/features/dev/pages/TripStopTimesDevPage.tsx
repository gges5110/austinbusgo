import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import React from "react";
import { useSearchParams } from "react-router-dom";
import { useRoutesQuery } from "shared/api/schemas/Routes.generated";
import { useTripIdsForRouteQuery } from "shared/api/schemas/TripIdsForRoute.generated";
import { Route } from "shared/types/interface.d";

import { TripAccordionWithFilter } from "../components/TripStopTimes/TripAccordionWithFilter";

export const TripStopTimesDevPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRoute, setSelectedRoute] = React.useState<Route | null>(null);
  const [selectedDirection, setSelectedDirection] = React.useState<number | "">(
    ""
  );

  const { data: routesData } = useRoutesQuery();
  const routes = routesData?.routes || [];

  // Initialize state from URL params
  React.useEffect(() => {
    if (routes.length > 0) {
      const routeIdFromUrl = searchParams.get("routeId");
      const directionFromUrl = searchParams.get("directionId");

      if (routeIdFromUrl && !selectedRoute) {
        const route = routes.find((r) => r.routeId === routeIdFromUrl);
        if (route) {
          setSelectedRoute(route);
        }
      }

      if (directionFromUrl && selectedDirection === "") {
        const direction = parseInt(directionFromUrl, 10);
        if (!isNaN(direction) && (direction === 0 || direction === 1)) {
          setSelectedDirection(direction);
        }
      }
    }
  }, [routes, searchParams, selectedRoute, selectedDirection]);

  const today = dayjs().format("YYYYMMDD");

  const { data: tripIdsData } = useTripIdsForRouteQuery(
    {
      routeId: selectedRoute?.routeId || "",
      date: today,
    },
    {
      enabled: !!selectedRoute?.routeId,
    }
  );

  // Get all trip IDs for the selected route
  const tripIds = tripIdsData?.tripIdsForRoute.tripIds || [];

  // GTFS only uses Direction 0 and Direction 1
  const availableDirections = [0, 1];

  // Filter will happen in the TripAccordionWithFilter component
  const filteredTripIds = React.useMemo(() => {
    if (selectedDirection === "") return [];
    return tripIds;
  }, [tripIds, selectedDirection]);

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography gutterBottom={true} variant={"h4"}>
            Trip Stop Times Lookup
          </Typography>
          <Typography
            color={"text.secondary"}
            gutterBottom={true}
            variant={"body2"}
          >
            Select a route and direction to view all trip stop times
          </Typography>

          <Box sx={{ mt: 3, display: "flex", gap: 2, flexDirection: "column" }}>
            <Autocomplete
              getOptionLabel={(option) =>
                `${option.routeId} - ${option.routeLongName}`
              }
              onChange={(_, newValue) => {
                setSelectedRoute(newValue);
                setSelectedDirection("");
                // Update URL
                if (newValue) {
                  setSearchParams({ routeId: newValue.routeId });
                } else {
                  setSearchParams({});
                }
              }}
              options={routes}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={"Route"}
                  placeholder={"Select a route"}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.routeId}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={option.routeId}
                      size={"small"}
                      sx={{
                        backgroundColor: `#${option.routeColor}`,
                        color: "white",
                        fontWeight: 600,
                      }}
                    />
                    <Typography>{option.routeLongName}</Typography>
                  </Box>
                </li>
              )}
              value={selectedRoute}
            />

            {selectedRoute && (
              <FormControl fullWidth={true}>
                <InputLabel>Direction</InputLabel>
                <Select
                  label={"Direction"}
                  onChange={(e) => {
                    const direction = e.target.value as number;
                    setSelectedDirection(direction);
                    // Update URL
                    if (selectedRoute) {
                      setSearchParams({
                        routeId: selectedRoute.routeId,
                        directionId: direction.toString(),
                      });
                    }
                  }}
                  value={selectedDirection}
                >
                  {availableDirections.map((direction) => (
                    <MenuItem key={direction} value={direction}>
                      {`Direction ${direction}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </CardContent>
      </Card>

      {selectedRoute && selectedDirection !== "" && (
        <Card>
          <CardContent>
            <Typography gutterBottom={true} variant={"h6"}>
              {`Trips for ${selectedRoute.routeId} - Direction ${selectedDirection}`}
            </Typography>
            <Typography color={"text.secondary"} variant={"body2"}>
              {"Date: "}
              {dayjs().format("MMMM D, YYYY")}
              {" • "}
              {filteredTripIds.length}
              {" trips found"}
            </Typography>
          </CardContent>
        </Card>
      )}

      {selectedRoute && selectedDirection !== "" && filteredTripIds.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {filteredTripIds.map((tripId) => (
            <TripAccordionWithFilter
              key={tripId}
              routeColor={selectedRoute.routeColor || "666666"}
              selectedDirection={selectedDirection as number}
              tripId={tripId}
            />
          ))}
        </Box>
      )}

      {selectedRoute &&
        selectedDirection !== "" &&
        filteredTripIds.length === 0 && (
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography align={"center"} color={"text.secondary"}>
              No trips found for this route and direction
            </Typography>
          </Paper>
        )}
    </Box>
  );
};
