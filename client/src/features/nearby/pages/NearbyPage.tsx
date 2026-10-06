import LocationOffIcon from "@mui/icons-material/LocationOff";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import {
  Alert,
  Box,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Typography,
} from "@mui/material";
import { NearbySheet } from "features/nearby/components/NearbySheet";
import { StopHeader } from "features/nearby/components/StopHeader";
import { StopIdEntry } from "features/nearby/components/StopIdEntry";
import { UpcomingRow } from "features/nearby/components/UpcomingRow";
import { useGeolocation } from "features/nearby/hooks/useGeolocation";
import {
  NEARBY_RADIUS_METERS,
  useNearestStop,
  WIDE_RADIUS_METERS,
} from "features/nearby/hooks/useNearestStop";
import { useServerNow, useUpcoming } from "features/nearby/hooks/useUpcoming";
import {
  formatClockTime,
  formatHeadsign,
} from "features/nearby/utils/countdown";
import { distanceMeters } from "features/nearby/utils/geo";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import * as React from "react";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { StopUpcoming } from "shared/api/generated/model";
import { useTitle } from "shared/hooks/UseTitle";
import {
  currentStopAtom,
  favoritesAtom,
  nearbyFocusAtom,
} from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";

// Beyond this GPS accuracy (meters) the nearest stop is a guess, so the
// other-stops switcher opens by default
const POOR_ACCURACY_METERS = 150;

/**
 * The phone home screen: buses coming to the stop the rider is standing at.
 * `/nearby` follows the rider's location; `/nearby/stop/:stopId` is pinned.
 */
export const NearbyPage: React.FC = () => {
  const { stopId: pinnedStopId } = useParams();
  const pinned = pinnedStopId !== undefined;
  const geolocation = useGeolocation(!pinned);
  const [radius, setRadius] = useState(NEARBY_RADIUS_METERS);
  const nearestStop = useNearestStop(
    pinned ? undefined : geolocation.position,
    radius
  );
  const stopId = pinnedStopId ?? nearestStop.nearest?.stop.stopId;
  const upcoming = useUpcoming(stopId);
  const nowSeconds = useServerNow(upcoming.clockOffset);

  useSyncMapFocus(stopId, upcoming.data, geolocation.position);
  const [focus, setFocus] = useAtom(nearbyFocusAtom);
  const selectedTripId = focus?.selectedTripId;
  const toggleTrip = (tripId: string) =>
    setFocus((current) =>
      current
        ? {
            ...current,
            selectedTripId:
              current.selectedTripId === tripId ? undefined : tripId,
          }
        : current
    );

  const stop = upcoming.data?.stop;
  useTitle(
    stop ? `${stop.stopName} - Austin Bus Go` : "Nearby - Austin Bus Go"
  );

  if (pinned && isNotFound(upcoming.error)) {
    return (
      <NearbySheet>
        <Message title={`We couldn't find stop ${pinnedStopId}`}>
          Check the stop ID on the sign and try again.
        </Message>
        <StopIdEntry prominent={true} />
      </NearbySheet>
    );
  }

  if (!pinned && !geolocation.position) {
    if (geolocation.status === "locating") {
      return (
        <NearbySheet>
          <Message title={"Finding stops near you…"} />
          <StopIdEntry />
        </NearbySheet>
      );
    }
    return (
      <NearbySheet>
        <LocationUnavailable onRetry={geolocation.retry} />
      </NearbySheet>
    );
  }

  if (!pinned && !nearestStop.isLoading && !nearestStop.nearest) {
    return (
      <NearbySheet>
        <Message title={"No stops within a 5-minute walk"}>
          {radius < WIDE_RADIUS_METERS && (
            <Button
              onClick={() => setRadius(WIDE_RADIUS_METERS)}
              sx={{ mt: 1 }}
              variant={"outlined"}
            >
              Show the closest
            </Button>
          )}
        </Message>
        <StopIdEntry />
      </NearbySheet>
    );
  }

  const distance =
    stop?.stopLoc?.coordinates && geolocation.position
      ? distanceMeters(geolocation.position, {
          latitude: stop.stopLoc.coordinates[1],
          longitude: stop.stopLoc.coordinates[0],
        })
      : undefined;

  return (
    <NearbySheet>
      {stop ? (
        <StopHeader
          alternates={pinned ? [] : nearestStop.alternates}
          distance={distance}
          pinned={pinned}
          showAlternates={(geolocation.accuracy ?? 0) > POOR_ACCURACY_METERS}
          stop={stop}
          updatedSecondsAgo={
            upcoming.dataUpdatedAt
              ? Date.now() / 1000 - upcoming.dataUpdatedAt / 1000
              : undefined
          }
        />
      ) : (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Skeleton height={32} width={"60%"} />
          <Skeleton height={20} width={"40%"} />
        </Box>
      )}

      {upcoming.data && !upcoming.data.realtimeAvailable && (
        <Alert severity={"info"} sx={{ borderRadius: 0 }}>
          Live tracking is unavailable right now. Showing scheduled times.
        </Alert>
      )}

      {!upcoming.data ? (
        <Box sx={{ px: 2 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton height={56} key={i} />
          ))}
        </Box>
      ) : upcoming.data.arrivals.length === 0 ? (
        <Message title={"No buses in the next hour"}>
          {upcoming.data.nextScheduled &&
            `Next: Route ${upcoming.data.nextScheduled.routeId} ${formatHeadsign(
              upcoming.data.nextScheduled.headsign,
              upcoming.data.nextScheduled.routeId
            )} at ${formatClockTime(upcoming.data.nextScheduled.scheduledAt)}`}
        </Message>
      ) : (
        <Box aria-live={"polite"} component={"ul"} sx={{ m: 0, p: 0 }}>
          {upcoming.data.arrivals.map((arrival) => (
            <UpcomingRow
              arrival={arrival}
              expanded={arrival.tripId === selectedTripId}
              key={`${arrival.tripId}-${arrival.scheduledAt}`}
              nowSeconds={nowSeconds}
              onToggle={() => toggleTrip(arrival.tripId)}
              stopId={upcoming.data.stop.stopId}
            />
          ))}
        </Box>
      )}

      {!pinned && <StopIdEntry />}
    </NearbySheet>
  );
};

const isNotFound = (error: unknown) => String(error).includes(" 404 ");

/**
 * Publishes the stop and its arrivals to the map (nearbyFocusAtom +
 * currentStopAtom), keeping the rider's expanded row across refreshes, and
 * clears both when the rider leaves Nearby.
 */
const useSyncMapFocus = (
  stopId: string | undefined,
  data: StopUpcoming | undefined,
  rider: { latitude: number; longitude: number } | undefined
) => {
  const setFocus = useSetAtom(nearbyFocusAtom);
  const setCurrentStop = useSetAtom(currentStopAtom);

  useEffect(() => {
    if (!stopId) return;
    setFocus((current) => {
      const arrivals = data?.stop.stopId === stopId ? data.arrivals : [];
      const sameStop = current?.stopId === stopId;
      const selectedTripId =
        sameStop &&
        arrivals.some((arrival) => arrival.tripId === current?.selectedTripId)
          ? current?.selectedTripId
          : undefined;
      return { arrivals, rider, selectedTripId, stopId };
    });
    if (data?.stop.stopId === stopId) {
      // Same stop → keep the existing object so the map doesn't react to
      // each 15s refresh
      setCurrentStop((current) =>
        current?.stopId === stopId ? current : (data.stop as Stop)
      );
    }
  }, [stopId, data, rider, setFocus, setCurrentStop]);

  useEffect(
    () => () => {
      setFocus(undefined);
      setCurrentStop(undefined);
    },
    [setFocus, setCurrentStop]
  );
};

const Message: React.FC<React.PropsWithChildren<{ title: string }>> = ({
  children,
  title,
}) => (
  <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
    <Typography variant={"subtitle1"}>{title}</Typography>
    {children && (
      <Typography color={"text.secondary"} component={"div"} variant={"body2"}>
        {children}
      </Typography>
    )}
  </Box>
);

/** Location denied or unsupported: stop ID first, then saved stops. */
const LocationUnavailable: React.FC<{ onRetry: () => void }> = ({
  onRetry,
}) => {
  const favorites = useAtomValue(favoritesAtom);
  const savedStops = favorites.filter(
    (favorite): favorite is Stop => "stopId" in favorite
  );

  return (
    <>
      <Box sx={{ px: 2, pt: 3, textAlign: "center" }}>
        <LocationOffIcon color={"action"} />
        <Typography variant={"subtitle1"}>
          Enter the stop ID from the sign
        </Typography>
        <Typography color={"text.secondary"} variant={"body2"}>
          Or allow location access to see the stop you&apos;re at.
        </Typography>
      </Box>
      <StopIdEntry prominent={true} />
      <Box sx={{ textAlign: "center" }}>
        <Button onClick={onRetry} startIcon={<MyLocationIcon />}>
          Use my location
        </Button>
      </Box>
      {savedStops.length > 0 && (
        <List
          subheader={
            <Typography
              color={"text.secondary"}
              sx={{ px: 2, pt: 1 }}
              variant={"caption"}
            >
              Saved stops
            </Typography>
          }
        >
          {savedStops.map((savedStop) => (
            <ListItemButton
              component={RouterLink}
              key={savedStop.stopId}
              to={`/nearby/stop/${savedStop.stopId}`}
            >
              <ListItemText
                primary={savedStop.stopName}
                secondary={`Stop ${savedStop.stopCode ?? savedStop.stopId}`}
              />
            </ListItemButton>
          ))}
        </List>
      )}
    </>
  );
};
