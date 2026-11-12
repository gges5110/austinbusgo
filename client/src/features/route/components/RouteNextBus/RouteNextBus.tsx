import MyLocationIcon from "@mui/icons-material/MyLocation";
import {
  Autocomplete,
  Box,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import { UpcomingList } from "features/nearby/components/UpcomingList";
import {
  GeolocationState,
  useGeolocation,
} from "features/nearby/hooks/useGeolocation";
import {
  NEARBY_RADIUS_METERS,
  sortByDistance,
  useStableAnchor,
  WIDE_RADIUS_METERS,
} from "features/nearby/hooks/useNearestStop";
import { useServerNow, useUpcoming } from "features/nearby/hooks/useUpcoming";
import { LatLon } from "features/nearby/utils/geo";
import { isStop } from "features/search/components/SearchPanel/hooks/searchPanelUtils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Stop } from "shared/api/generated/model";
import { useRecentSearches } from "shared/hooks/UseRecentSearches";
import {
  favoritesAtom,
  mapsFlyToCoordinateAtom,
  routeStopsAtom,
} from "shared/state/atoms";
import { track } from "shared/track";

interface RouteNextBusProps {
  routeId: string;
  directionId: number;
  /** This direction's stops, in order */
  stops: Stop[];
}

export type StopChoice = "pick" | "location" | "remembered" | "recent";

/**
 * Which of this route's stops the rider is at, best guess first:
 * just picked › standing next to it › picked here before › saved or
 * recently opened › within a longer walk.
 */
export const chooseStop = ({
  stops,
  picked,
  remembered,
  yourStopIds,
  position,
}: {
  stops: Stop[];
  picked?: string;
  remembered?: string;
  yourStopIds: string[];
  position?: { latitude: number; longitude: number };
}): { stop: Stop; how: StopChoice } | undefined => {
  const byId = (id?: string) => stops.find((stop) => stop.stopId === id);
  const nearest = position ? sortByDistance(stops, position)[0] : undefined;

  const pickedStop = byId(picked);
  if (pickedStop) return { stop: pickedStop, how: "pick" };
  if (nearest && nearest.distance <= NEARBY_RADIUS_METERS) {
    return { stop: nearest.stop, how: "location" };
  }
  const rememberedStop = byId(remembered);
  if (rememberedStop) return { stop: rememberedStop, how: "remembered" };
  const yours = yourStopIds.map(byId).find(Boolean);
  if (yours) return { stop: yours, how: "recent" };
  if (nearest && nearest.distance <= WIDE_RADIUS_METERS) {
    return { stop: nearest.stop, how: "location" };
  }
  return undefined;
};

/**
 * The answer a rider on a route page came for: when the next bus reaches
 * their stop, and where it is now (stops away; tap to see it on the map).
 *
 * Render it with `key={route:direction}` so a pick, "Change stop" and the
 * arrivals query all start fresh in the other direction.
 */
export const RouteNextBus: React.FC<RouteNextBusProps> = ({
  routeId,
  directionId,
  stops,
}) => {
  const key = `${routeId}:${directionId}`;
  const [routeStops, setRouteStops] = useAtom(routeStopsAtom);
  const [picked, setPicked] = useState<string>();
  const [changing, setChanging] = useState(false);
  const geolocation = useGeolocation();
  // Moves only after a real walk, so GPS jitter between two close stops
  // doesn't flip the card back and forth
  const anchor = useStableAnchor(geolocation.position);
  const yourStopIds = useYourStopIds();

  const choice = chooseStop({
    stops,
    picked,
    remembered: routeStops[key],
    yourStopIds,
    position: anchor,
  });
  const stop = choice?.stop;

  useEffect(() => {
    if (choice) track("route_stop", [choice.how, routeId, choice.stop.stopId]);
    // Once per stop the card settles on
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stop?.stopId]);

  const pick = (stopId: string) => {
    setPicked(stopId);
    setChanging(false);
    setRouteStops((current) => ({ ...current, [key]: stopId }));
  };

  if (!stop || changing) {
    return (
      <StopPicker
        farFromRoute={farFromRoute(stops, anchor)}
        geolocation={geolocation}
        onCancel={stop ? () => setChanging(false) : undefined}
        onPick={pick}
        stops={stops}
      />
    );
  }

  return (
    <NextBusAtStop
      directionId={directionId}
      onChange={() => setChanging(true)}
      routeId={routeId}
      stop={stop}
    />
  );
};

/** Saved stops, then recently opened ones */
const useYourStopIds = () => {
  const favorites = useAtomValue(favoritesAtom);
  const { recentSearches } = useRecentSearches();
  return useMemo(
    () => [
      ...favorites
        .filter((favorite): favorite is Stop => "stopId" in favorite)
        .map((stop) => stop.stopId),
      ...recentSearches
        .map((search) => search.value)
        .filter(isStop)
        .map((stop) => stop.stopId),
    ],
    [favorites, recentSearches]
  );
};

/** No stop of this direction within a long walk of the rider */
const farFromRoute = (stops: Stop[], position?: LatLon) => {
  if (!position) return false;
  const nearest = sortByDistance(stops, position)[0];
  return !nearest || nearest.distance > WIDE_RADIUS_METERS;
};

interface NextBusAtStopProps {
  directionId: number;
  onChange: () => void;
  routeId: string;
  stop: Stop;
}

const NextBusAtStop: React.FC<NextBusAtStopProps> = ({
  directionId,
  onChange,
  routeId,
  stop,
}) => {
  // Only this route's buses, so "next bus tomorrow at …" is this route's
  const upcoming = useUpcoming(stop.stopId, {
    direction_id: directionId,
    route_id: routeId,
  });
  const nowSeconds = useServerNow(upcoming.clockOffset);
  const [expandedTripId, setExpandedTripId] = useState<string>();
  const flyTo = useSetAtom(mapsFlyToCoordinateAtom);
  // Only this stop's data (keepPreviousData still holds the last stop's)
  const data =
    !upcoming.isPreviousData && upcoming.data?.stop.stopId === stop.stopId
      ? upcoming.data
      : undefined;

  const toggle = (tripId: string) => {
    const opening = expandedTripId !== tripId;
    setExpandedTripId(opening ? tripId : undefined);
    const vehicle = data?.arrivals.find(
      (arrival) => arrival.tripId === tripId
    )?.vehicle;
    if (opening && vehicle) flyTo([vehicle.lon, vehicle.lat]);
  };

  return (
    <Box aria-label={"Next bus"} component={"section"}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, px: 2, pt: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography color={"text.secondary"} variant={"caption"}>
            Next bus at
          </Typography>
          <Typography noWrap={true} sx={{ fontWeight: 600 }} variant={"body1"}>
            {stop.stopName}
          </Typography>
        </Box>
        <Button onClick={onChange} size={"small"}>
          Change stop
        </Button>
      </Box>
      <UpcomingList
        data={data}
        directionId={directionId}
        emptyTitle={`No ${routeId} buses at this stop in the next hour`}
        expandedTripId={expandedTripId}
        limit={2}
        nowSeconds={nowSeconds}
        onToggle={toggle}
        routeIds={[routeId]}
      />
    </Box>
  );
};

const stopLabel = (stop: Stop) =>
  stop.stopName ?? `Stop ${stop.stopCode ?? stop.stopId}`;

interface StopPickerProps {
  /** The rider's location is known and no stop is within a long walk */
  farFromRoute: boolean;
  geolocation: GeolocationState;
  onCancel?: () => void;
  onPick: (stopId: string) => void;
  stops: Stop[];
}

const StopPicker: React.FC<StopPickerProps> = ({
  farFromRoute,
  geolocation,
  onCancel,
  onPick,
  stops,
}) => {
  const locating = geolocation.status === "locating";
  const canUseLocation =
    geolocation.supported &&
    geolocation.status !== "denied" &&
    // Already located: asking again changes nothing
    !geolocation.position;

  return (
    <Box aria-label={"Next bus"} component={"section"} sx={{ px: 2, py: 1.5 }}>
      <Typography sx={{ fontWeight: 600 }} variant={"body1"}>
        Which stop are you at?
      </Typography>
      <Typography color={"text.secondary"} variant={"body2"}>
        {farFromRoute
          ? "You're not near this route. Pick a stop to see its next bus."
          : "See when the next bus gets there and where it is now."}
      </Typography>
      <Autocomplete
        autoHighlight={true}
        getOptionLabel={stopLabel}
        isOptionEqualToValue={(option, value) => option.stopId === value.stopId}
        onChange={(_event, value) => value && onPick(value.stopId)}
        options={stops}
        renderInput={(params) => (
          <TextField {...params} label={"Stop"} size={"small"} />
        )}
        renderOption={(props, stop) => (
          <li {...props} key={stop.stopId}>
            <Box>
              <Typography variant={"body2"}>{stopLabel(stop)}</Typography>
              <Typography color={"text.secondary"} variant={"caption"}>
                {`Stop ${stop.stopCode ?? stop.stopId}`}
              </Typography>
            </Box>
          </li>
        )}
        sx={{ mt: 1.5 }}
      />
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        {canUseLocation && (
          <Button
            disabled={locating}
            onClick={geolocation.request}
            size={"small"}
            startIcon={<MyLocationIcon />}
          >
            {locating ? "Finding your stop…" : "Use my location"}
          </Button>
        )}
        {onCancel && (
          <Button onClick={onCancel} size={"small"}>
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
};
