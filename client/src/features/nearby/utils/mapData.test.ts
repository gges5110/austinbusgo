import { UpcomingArrival } from "shared/api/generated/model";
import { expect, test } from "vitest";

import { toVehiclePositions, trackPath } from "./mapData";

const point = (lon: number, lat: number) => ({
  type: "Point",
  coordinates: [lon, lat],
});

const live: UpcomingArrival = {
  tripId: "t1",
  routeId: "801",
  scheduledAt: 0,
  status: "arriving",
  vehicle: { id: "bus-1", lat: 30.1, lon: -97.8, bearing: 15, updatedAt: 5 },
  track: [
    {
      stopId: "a",
      stopSequence: 4,
      stopLoc: point(-97.81, 30.09),
      at: 0,
      isVehicleHere: true,
    },
    {
      stopId: "b",
      stopSequence: 5,
      stopLoc: point(-97.79, 30.11),
      at: 0,
      isVehicleHere: false,
    },
  ],
};

const scheduled: UpcomingArrival = {
  tripId: "t2",
  routeId: "1",
  scheduledAt: 0,
  status: "scheduled",
};

test("only arrivals with a vehicle become map vehicles", () => {
  const [vehicle, ...rest] = toVehiclePositions([live, scheduled]);

  expect(rest).toEqual([]);
  expect(vehicle.vehicle?.id).toBe("bus-1");
  expect(vehicle.trip?.routeId).toBe("801");
  expect(vehicle.position).toEqual({
    latitude: 30.1,
    longitude: -97.8,
    bearing: 15,
  });
  // Arriving buses use the orange "incoming" marker
  expect(vehicle.currentStatus).toBe("INCOMING_AT");
});

test("trackPath starts at the bus and skips the stop it is sitting at", () => {
  expect(trackPath(live)).toEqual([
    [-97.8, 30.1],
    [-97.79, 30.11],
  ]);
});
