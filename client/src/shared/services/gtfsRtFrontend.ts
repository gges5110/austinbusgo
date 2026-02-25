/**
 * Frontend GTFS Realtime Service
 *
 * Fetches and decodes GTFS-RT protobuf feeds directly in the browser,
 * bypassing the backend server entirely.
 *
 * NOTE on CORS: data.texas.gov is a Socrata open-data platform that serves
 * CORS headers, so these requests should succeed from any origin. If a feed
 * URL is ever moved to a provider that doesn't support CORS you would need a
 * transparent proxy (e.g. a cheap Cloud Run sidecar or Cloudflare Worker)
 * to relay the binary response without touching it.
 */

import * as GtfsRealtimeBindings from "gtfs-realtime-bindings";
import {
  Position,
  StopTimeUpdate,
  TripUpdate,
  VehiclePosition,
  VehicleStopStatus,
} from "shared/types/interface.d";

const VEHICLE_POSITIONS_URL =
  "https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream";
const TRIP_UPDATES_URL =
  "https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Safely coerce a protobuf Long / number / null to a JS number or null. */
function toLong(
  value: number | { toNumber(): number } | null | undefined
): number | null {
  if (value == null) return null;
  return typeof value === "number" ? value : value.toNumber();
}

function mapVehicleStatus(
  status:
    | GtfsRealtimeBindings.transit_realtime.VehiclePosition.VehicleStopStatus
    | null
    | undefined
): VehicleStopStatus | null {
  switch (status) {
    case GtfsRealtimeBindings.transit_realtime.VehiclePosition.VehicleStopStatus
      .INCOMING_AT:
      return VehicleStopStatus.IncomingAt;
    case GtfsRealtimeBindings.transit_realtime.VehiclePosition.VehicleStopStatus
      .STOPPED_AT:
      return VehicleStopStatus.StoppedAt;
    case GtfsRealtimeBindings.transit_realtime.VehiclePosition.VehicleStopStatus
      .IN_TRANSIT_TO:
      return VehicleStopStatus.InTransitTo;
    default:
      return null;
  }
}

async function fetchFeed(
  url: string
): Promise<GtfsRealtimeBindings.transit_realtime.FeedMessage> {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(
      `GTFS-RT feed request failed: ${response.status} ${response.statusText}`
    );
  }
  const buffer = await response.arrayBuffer();
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer)
  );
}

// ─── public API ───────────────────────────────────────────────────────────────

/** Fetch and decode all vehicle positions from the CapMetro GTFS-RT feed. */
export async function fetchVehiclePositions(): Promise<VehiclePosition[]> {
  const feed = await fetchFeed(VEHICLE_POSITIONS_URL);

  const entitiesWithVehicle = (feed.entity ?? []).filter(
    (e): e is typeof e & { vehicle: NonNullable<typeof e.vehicle> } =>
      e.vehicle != null && e.vehicle.trip != null
  );

  return entitiesWithVehicle.map((e) => {
    const vp = e.vehicle;
    const pos = vp.position;

    const position: Position | null = pos
      ? {
          latitude: pos.latitude,
          longitude: pos.longitude,
          bearing: pos.bearing ?? null,
          speed: pos.speed ?? null,
        }
      : null;

    return {
      trip: {
        tripId: vp.trip?.tripId ?? null,
        routeId: vp.trip?.routeId ?? null,
        startDate: vp.trip?.startDate ?? null,
        startTime: vp.trip?.startTime ?? null,
      },
      vehicle: vp.vehicle
        ? {
            id: vp.vehicle.id ?? null,
            label: vp.vehicle.label ?? null,
            licensePlate: vp.vehicle.licensePlate ?? null,
          }
        : null,
      position,
      stopId: vp.stopId ?? null,
      currentStatus: mapVehicleStatus(vp.currentStatus),
      timestamp: toLong(vp.timestamp),
      congestionLevel: vp.congestionLevel ?? null,
      currentStopSequence: vp.currentStopSequence ?? null,
    } as VehiclePosition;
  });
}

/**
 * Fetch and decode trip updates from the CapMetro GTFS-RT feed.
 * Optionally filter by routeId or tripId (mirrors the backend resolver API).
 */
export async function fetchTripUpdates(
  routeId?: string,
  tripId?: string
): Promise<TripUpdate[]> {
  const feed = await fetchFeed(TRIP_UPDATES_URL);

  const tripUpdateEntities = (feed.entity ?? [])
    .map((e) => e.tripUpdate)
    .filter((tu): tu is NonNullable<typeof tu> => tu != null);

  return tripUpdateEntities
    .filter((tu) => {
      if (routeId && tu.trip?.routeId !== routeId) return false;
      if (tripId && tu.trip?.tripId !== tripId) return false;
      return true;
    })
    .map((tu) => {
      const stopTimeUpdate: StopTimeUpdate[] = (tu.stopTimeUpdate ?? []).map(
        (stu) => ({
          stopId: stu.stopId ?? null,
          stopSequence: stu.stopSequence ?? null,
          arrival: stu.arrival
            ? {
                time: toLong(stu.arrival.time),
                delay: stu.arrival.delay ?? null,
                uncertainty: stu.arrival.uncertainty ?? null,
              }
            : null,
          departure: stu.departure
            ? {
                time: toLong(stu.departure.time),
                delay: stu.departure.delay ?? null,
                uncertainty: stu.departure.uncertainty ?? null,
              }
            : null,
          scheduleRelationship: stu.scheduleRelationship ?? null,
        })
      );

      return {
        trip: {
          tripId: tu.trip?.tripId ?? null,
          routeId: tu.trip?.routeId ?? null,
          startDate: tu.trip?.startDate ?? null,
          startTime: tu.trip?.startTime ?? null,
        },
        vehicle: {
          id: tu.vehicle?.id ?? null,
          label: tu.vehicle?.label ?? null,
          licensePlate: tu.vehicle?.licensePlate ?? null,
        },
        stopTimeUpdate,
        timestamp: toLong(tu.timestamp) ?? 0,
        delay: tu.delay ?? null,
      } as TripUpdate;
    });
}
