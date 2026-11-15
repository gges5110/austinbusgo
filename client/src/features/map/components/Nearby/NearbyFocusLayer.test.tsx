import { render } from "@testing-library/react";
import * as React from "react";
import { UpcomingArrival } from "shared/api/generated/model";
import { NearbyFocus } from "shared/state/atoms";
import { Stop } from "shared/types/interface.d";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NearbyFocusLayer } from "./NearbyFocusLayer";

const map = vi.hoisted(() => ({ fitBounds: vi.fn() }));

vi.mock("react-map-gl/mapbox", () => ({
  Layer: () => null,
  Source: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useMap: () => ({ current: map }),
}));

// ~111 m per 0.001° of latitude
const STOP_AT = { latitude: 30.2, longitude: -97.8 };
const north = (meters: number) => ({
  ...STOP_AT,
  latitude: STOP_AT.latitude + meters / 111195,
});

const stop = {
  stopId: "1",
  stopName: "Stop",
  stopLoc: {
    type: "Point",
    coordinates: [STOP_AT.longitude, STOP_AT.latitude],
  },
} as Stop;

// A live bus 5 km away
const BUS = north(5000);
const arrivals = [
  {
    tripId: "t1",
    routeId: "10",
    scheduledAt: 0,
    status: "live",
    vehicle: { id: "v1", lat: BUS.latitude, lon: BUS.longitude },
  } as unknown as UpcomingArrival,
];

const framedLatitudes = () => {
  const [[, south], [, northEdge]] = map.fitBounds.mock.calls[0][0];
  return [south, northEdge];
};

describe("NearbyFocusLayer", () => {
  beforeEach(() => map.fitBounds.mockClear());

  it("at the stop: frames the stop, the rider and the nearest bus", () => {
    const focus: NearbyFocus = { arrivals, rider: north(100), stopId: "1" };
    render(<NearbyFocusLayer focus={focus} stop={stop} />);

    expect(framedLatitudes()[1]).toBeCloseTo(BUS.latitude);
  });

  it("walking to a far stop: frames the rider and the stop, not the bus", () => {
    const rider = north(-1200);
    const focus: NearbyFocus = { arrivals, rider, stopId: "1" };
    render(<NearbyFocusLayer focus={focus} stop={stop} />);

    const [south, northEdge] = framedLatitudes();
    expect(south).toBeCloseTo(rider.latitude);
    expect(northEdge).toBeCloseTo(STOP_AT.latitude);
  });
});
