import { render, screen } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { StopUpcoming } from "shared/api/generated/model";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { NearbyPage } from "./NearbyPage";

const mocks = vi.hoisted(() => ({
  geolocation: vi.fn(),
  nearestStop: vi.fn(),
  upcoming: vi.fn(),
}));

vi.mock("features/nearby/hooks/useGeolocation", () => ({
  useGeolocation: () => mocks.geolocation(),
}));

vi.mock("features/nearby/hooks/useNearestStop", async () => ({
  ...(await vi.importActual<object>("features/nearby/hooks/useNearestStop")),
  useNearestStop: () => mocks.nearestStop(),
}));

vi.mock("features/nearby/hooks/useUpcoming", () => ({
  useUpcoming: () => mocks.upcoming(),
  useServerNow: () => NOW,
}));

const NOW = 1_800_000_000;
const HERE = { latitude: 30.2686, longitude: -97.7425 };

const stop = {
  stopId: "5869",
  stopCode: "5869",
  stopName: "St Edwards Station (NB)",
  stopLoc: { type: "Point", coordinates: [-97.7595, 30.2306] },
  routes: [],
};

const upcomingData = (overrides: Partial<StopUpcoming> = {}): StopUpcoming => ({
  stop,
  generatedAt: NOW,
  realtimeAvailable: true,
  arrivals: [
    {
      tripId: "t1",
      routeId: "801",
      headsign: "801 Tech Ridge Park & Ride NB",
      scheduledAt: NOW + 300,
      predictedAt: NOW + 420,
      stopsAway: 2,
      status: "en_route",
    },
  ],
  ...overrides,
});

const renderAt = (path: string) =>
  render(
    <JotaiProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<NearbyPage />} path={"/nearby"} />
          <Route element={<NearbyPage />} path={"/nearby/stop/:stopId"} />
        </Routes>
      </MemoryRouter>
    </JotaiProvider>
  );

describe("NearbyPage", () => {
  beforeEach(() => {
    mocks.geolocation.mockReturnValue({
      position: HERE,
      accuracy: 10,
      status: "granted",
      retry: vi.fn(),
    });
    mocks.nearestStop.mockReturnValue({
      nearest: { stop, distance: 40 },
      alternates: [],
      isLoading: false,
      isError: false,
    });
    mocks.upcoming.mockReturnValue({
      data: upcomingData(),
      dataUpdatedAt: Date.now(),
      clockOffset: 0,
    });
  });

  test("shows the nearest stop's buses with live countdowns", () => {
    renderAt("/nearby");

    expect(screen.getByRole("heading", { name: stop.stopName })).toBeTruthy();
    expect(screen.getByText("7 min")).toBeTruthy();
    expect(screen.getByText("2 stops away")).toBeTruthy();
  });

  test("while locating, offers the stop-ID field", () => {
    mocks.geolocation.mockReturnValue({ status: "locating", retry: vi.fn() });

    renderAt("/nearby");

    expect(screen.getByText("Finding stops near you…")).toBeTruthy();
    expect(screen.getByLabelText("Stop ID")).toBeTruthy();
  });

  test("location denied: stop ID first, with a way to retry", () => {
    const retry = vi.fn();
    mocks.geolocation.mockReturnValue({ status: "denied", retry });

    renderAt("/nearby");

    expect(screen.getByText("Enter the stop ID from the sign")).toBeTruthy();
    expect(screen.getByLabelText("Stop ID")).toBeTruthy();
    screen.getByRole("button", { name: "Use my location" }).click();
    expect(retry).toHaveBeenCalled();
  });

  test("no stop within walking distance offers a wider search", () => {
    mocks.nearestStop.mockReturnValue({
      alternates: [],
      isLoading: false,
      isError: false,
    });

    renderAt("/nearby");

    expect(screen.getByText("No stops within a 5-minute walk")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Show the closest" })
    ).toBeTruthy();
  });

  test("pinned stop shows the unpin control", () => {
    renderAt("/nearby/stop/5869");

    expect(
      screen.getByRole("button", {
        name: "Unpin stop and follow my location",
      })
    ).toBeTruthy();
  });

  test("unknown pinned stop", () => {
    mocks.upcoming.mockReturnValue({
      error: new Error("API request failed: 404 /api/stops/999/upcoming"),
      clockOffset: 0,
    });

    renderAt("/nearby/stop/999");

    expect(screen.getByText("We couldn't find stop 999")).toBeTruthy();
  });

  test("empty hour shows the next scheduled bus", () => {
    mocks.upcoming.mockReturnValue({
      data: upcomingData({
        arrivals: [],
        nextScheduled: {
          tripId: "t9",
          routeId: "7",
          headsign: "7 Duval",
          scheduledAt: NOW + 6 * 3600,
          status: "scheduled",
        },
      }),
      dataUpdatedAt: Date.now(),
      clockOffset: 0,
    });

    renderAt("/nearby");

    expect(screen.getByText("No buses in the next hour")).toBeTruthy();
    expect(screen.getByText(/Next: Route 7 Duval at/)).toBeTruthy();
  });

  test("realtime outage banner", () => {
    mocks.upcoming.mockReturnValue({
      data: upcomingData({ realtimeAvailable: false }),
      dataUpdatedAt: Date.now(),
      clockOffset: 0,
    });

    renderAt("/nearby");

    expect(screen.getByText(/Live tracking is unavailable/)).toBeTruthy();
  });
});
