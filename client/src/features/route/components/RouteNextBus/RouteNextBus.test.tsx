import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider as JotaiProvider } from "jotai";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { Stop, StopUpcoming } from "shared/api/generated/model";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { chooseStop, RouteNextBus } from "./RouteNextBus";

const mocks = vi.hoisted(() => ({
  geolocation: vi.fn(),
  upcoming: vi.fn(),
}));

vi.mock("features/nearby/hooks/useGeolocation", () => ({
  useGeolocation: () => mocks.geolocation(),
}));

vi.mock("features/nearby/hooks/useUpcoming", () => ({
  useUpcoming: (stopId?: string, params?: object) =>
    mocks.upcoming(stopId, params),
  useServerNow: () => NOW,
}));

const NOW = 1_800_000_000;

const at = (stopId: string, stopName: string, lat: number): Stop => ({
  stopId,
  stopCode: stopId,
  stopName,
  stopLoc: { type: "Point", coordinates: [-97.74, lat] },
});
// About 1.1 km apart, north to south
const stops = [
  at("100", "Guadalupe/27th", 30.29),
  at("200", "Guadalupe/17th", 30.28),
  at("300", "Congress/5th", 30.27),
];

const upcomingAt = (stop: Stop): StopUpcoming => ({
  stop,
  generatedAt: NOW,
  realtimeAvailable: true,
  arrivals: [
    {
      tripId: "other-route",
      routeId: "7",
      headsign: "7 Duval",
      scheduledAt: NOW + 60,
      status: "en_route",
    },
    {
      tripId: "other-direction",
      routeId: "640",
      directionId: 1,
      headsign: "Forty Acres",
      scheduledAt: NOW + 120,
      status: "en_route",
    },
    {
      tripId: "mine",
      routeId: "640",
      directionId: 0,
      headsign: "Forty Acres",
      scheduledAt: NOW + 240,
      predictedAt: NOW + 300,
      stopsAway: 2,
      status: "en_route",
    },
  ],
});

const noLocation = {
  status: "idle",
  request: vi.fn(),
  supported: true,
};

const renderCard = () =>
  render(
    <JotaiProvider>
      <MemoryRouter>
        <RouteNextBus directionId={0} routeId={"640"} stops={stops} />
      </MemoryRouter>
    </JotaiProvider>
  );

describe("chooseStop", () => {
  const base = { stops, yourStopIds: [] as string[] };
  const near200 = { latitude: 30.2801, longitude: -97.74 };

  test("nothing to go on: no stop", () => {
    expect(chooseStop(base)).toBeUndefined();
  });

  test("a pick beats everything", () => {
    expect(
      chooseStop({
        ...base,
        picked: "300",
        remembered: "100",
        position: near200,
      })
    ).toMatchObject({ stop: { stopId: "300" }, how: "pick" });
  });

  test("standing at a stop beats the remembered one", () => {
    expect(
      chooseStop({ ...base, remembered: "100", position: near200 })
    ).toMatchObject({ stop: { stopId: "200" }, how: "location" });
  });

  test("remembered, then saved or recent stops on this route", () => {
    expect(chooseStop({ ...base, remembered: "100" })?.how).toBe("remembered");
    expect(chooseStop({ ...base, yourStopIds: ["999", "300"] })).toMatchObject({
      stop: { stopId: "300" },
      how: "recent",
    });
  });

  test("a stop that's no longer on the route is ignored", () => {
    expect(chooseStop({ ...base, remembered: "999" })).toBeUndefined();
  });

  test("far from the route: no guess", () => {
    expect(
      chooseStop({ ...base, position: { latitude: 30.5, longitude: -97.74 } })
    ).toBeUndefined();
  });
});

describe("RouteNextBus", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.geolocation.mockReturnValue(noLocation);
    mocks.upcoming.mockImplementation((stopId?: string) => {
      const stop = stops.find((s) => s.stopId === stopId);
      return { data: stop ? upcomingAt(stop) : undefined, clockOffset: 0 };
    });
  });

  test("asks which stop, then shows this route's next bus there", async () => {
    const user = userEvent.setup();
    renderCard();

    expect(screen.getByText("Which stop are you at?")).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Stop" }));
    await user.click(screen.getByRole("option", { name: /Guadalupe\/17th/ }));

    expect(screen.getByText("Guadalupe/17th")).toBeInTheDocument();
    // Only route 640 in this direction
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText(/2 stops away/)).toBeInTheDocument();
    expect(localStorage.getItem("routeStops")).toBe('{"640:0":"200"}');
    expect(mocks.upcoming).toHaveBeenLastCalledWith("200", {
      direction_id: 0,
      route_id: "640",
    });
  });

  test("opens straight to the stop picked last time", () => {
    localStorage.setItem("routeStops", '{"640:0":"300"}');
    renderCard();

    expect(screen.getByText("Congress/5th")).toBeInTheDocument();
    expect(screen.queryByText("Which stop are you at?")).toBeNull();
  });

  test("change stop goes back to the picker, and cancel returns", async () => {
    const user = userEvent.setup();
    localStorage.setItem("routeStops", '{"640:0":"300"}');
    renderCard();

    await user.click(screen.getByRole("button", { name: "Change stop" }));
    expect(screen.getByText("Which stop are you at?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Congress/5th")).toBeInTheDocument();
  });

  test("changing a stop found by location doesn't claim the rider is far", async () => {
    const user = userEvent.setup();
    mocks.geolocation.mockReturnValue({
      ...noLocation,
      status: "granted",
      position: { latitude: 30.2801, longitude: -97.74 },
    });
    renderCard();

    expect(screen.getByText("Guadalupe/17th")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Change stop" }));
    expect(screen.getByText("Which stop are you at?")).toBeInTheDocument();
    expect(screen.queryByText(/not near this route/)).toBeNull();
  });

  test("says so when no bus on this route is coming", () => {
    localStorage.setItem("routeStops", '{"640:0":"300"}');
    mocks.upcoming.mockReturnValue({
      data: { ...upcomingAt(stops[2]), arrivals: [] },
      clockOffset: 0,
    });
    renderCard();

    expect(
      screen.getByText("No 640 buses at this stop in the next hour")
    ).toBeInTheDocument();
  });

  test("late at night, says when this route's first bus comes", () => {
    localStorage.setItem("routeStops", '{"640:0":"300"}');
    mocks.upcoming.mockReturnValue({
      data: {
        ...upcomingAt(stops[2]),
        arrivals: [],
        nextScheduled: {
          tripId: "first",
          routeId: "640",
          directionId: 0,
          headsign: "Forty Acres",
          scheduledAt: NOW + 8 * 3600,
          status: "scheduled",
        },
      },
      clockOffset: 0,
    });
    renderCard();

    expect(
      screen.getByText(/Next bus: Route 640 Forty Acres/)
    ).toBeInTheDocument();
  });

  test("offers location, and explains when the rider is far away", () => {
    const { unmount } = renderCard();
    expect(
      screen.getByRole("button", { name: "Use my location" })
    ).toBeInTheDocument();
    unmount();

    mocks.geolocation.mockReturnValue({
      ...noLocation,
      status: "granted",
      position: { latitude: 30.5, longitude: -97.74 },
    });
    renderCard();
    expect(screen.getByText(/not near this route/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Use my location" })
    ).toBeNull();
  });
});
