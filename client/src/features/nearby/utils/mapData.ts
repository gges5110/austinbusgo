import { UpcomingArrival, VehiclePosition } from "shared/api/generated/model";

/**
 * Upcoming arrivals' buses in the shape the map's VehicleLayer draws.
 * Arriving buses use the "incoming" (orange) marker.
 */
export const toVehiclePositions = (
  arrivals: UpcomingArrival[]
): VehiclePosition[] =>
  arrivals.flatMap((arrival) => {
    const vehicle = arrival.vehicle;
    if (!vehicle) return [];
    return [
      {
        trip: { tripId: arrival.tripId, routeId: arrival.routeId },
        vehicle: { id: vehicle.id },
        position: {
          latitude: vehicle.lat,
          longitude: vehicle.lon,
          bearing: vehicle.bearing ?? 0,
        },
        currentStatus:
          arrival.status === "arriving" ? "INCOMING_AT" : "IN_TRANSIT_TO",
        timestamp: vehicle.updatedAt ?? null,
      },
    ];
  });

/** [lon, lat] path from the bus through its track stops to the rider's stop. */
export const trackPath = (arrival: UpcomingArrival): number[][] => {
  const points: number[][] = [];
  if (arrival.vehicle) {
    points.push([arrival.vehicle.lon, arrival.vehicle.lat]);
  }
  for (const stop of arrival.track ?? []) {
    // Skip the stop the bus is sitting at; its own position already starts
    // the line
    if (stop.isVehicleHere && arrival.vehicle) continue;
    if (stop.stopLoc?.coordinates) points.push(stop.stopLoc.coordinates);
  }
  return points;
};
