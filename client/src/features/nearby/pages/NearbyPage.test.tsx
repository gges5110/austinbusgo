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
    localStorage.clear();
    mocks.geolocation.mockReturnValue({
      position: HERE,
      accuracy: 10,
      status: "granted",
      request: vi.fn(),
      supported: true,
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
    mocks.geolocation.mockReturnValue({
      status: "locating",
      request: vi.fn(),
      supported: true,
    });

    renderAt("/nearby");

    expect(screen.getByText("Finding stops near you…")).toBeTruthy();
    expect(screen.getByLabelText("Stop ID")).toBeTruthy();
  });

  test("first visit: asks before using location, with other ways in", () => {
    const request = vi.fn();
    mocks.geolocation.mockReturnValue({
      status: "idle",
      request,
      supported: true,
    });

    renderAt("/nearby");

    expect(screen.getByText("See the next buses at your stop")).toBeTruthy();
    expect(screen.getByLabelText("Stop ID")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Or search for a route or stop" })
    ).toBeTruthy();
    expect(request).not.toHaveBeenCalled();
    screen.getByRole("button", { name: "Use my location" }).click();
    expect(request).toHaveBeenCalled();
  });

  test("first screen lists saved stops, then recent ones", () => {
    const saved = { ...stop, stopId: "1002", stopName: "Republic Square" };
    const recentStop = (stopId: string, stopName: string) => ({
      timestamp: 1,
      value: { ...stop, stopId, stopCode: stopId, stopName },
    });
    localStorage.setItem("favorites", JSON.stringify([saved]));
    localStorage.setItem(
      "recentSearches",
      JSON.stringify([
        recentStop("475", "Lamar/Brentwood"),
        // Already saved: not listed twice
        recentStop("1002", "Republic Square"),
        { timestamp: 1, value: { type: "searchTerm", value: "lamar" } },
        recentStop("618", "Brentwood/Lamar"),
        recentStop("1", "One"),
        recentStop("2", "Two"),
      ])
    );
    mocks.geolocation.mockReturnValue({
      status: "idle",
      request: vi.fn(),
      supported: true,
    });

    renderAt("/nearby");

    const links = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href) => href?.startsWith("/nearby/stop/"));
    // Saved first, then the 3 most recent unsaved stops
    expect(links).toEqual([
      "/nearby/stop/1002",
      "/nearby/stop/475",
      "/nearby/stop/618",
      "/nearby/stop/1",
    ]);
  });

  test("a stop still showing from before isn't remembered as opened", () => {
    // Switching to stop 999: the query still holds the previous stop
    renderAt("/nearby/stop/999");

    expect(localStorage.getItem("recentSearches")).toBeNull();
  });

  test("a stop opened by ID joins the recent stops", () => {
    renderAt("/nearby/stop/5869");

    const recent = JSON.parse(localStorage.getItem("recentSearches") ?? "[]");
    expect(recent[0].value.stopId).toBe("5869");
  });

  test("location blocked: explains how to allow it", () => {
    const request = vi.fn();
    mocks.geolocation.mockReturnValue({
      status: "denied",
      request,
      supported: true,
    });

    renderAt("/nearby");

    expect(screen.getByText("Location is blocked for this site")).toBeTruthy();
    expect(screen.getByText(/Website Settings › Location/)).toBeTruthy();
    expect(screen.getByLabelText("Stop ID")).toBeTruthy();
    screen.getByRole("button", { name: "Try again" }).click();
    expect(request).toHaveBeenCalled();
  });

  test("no geolocation in the browser: no dead retry button", () => {
    mocks.geolocation.mockReturnValue({
      status: "unavailable",
      request: vi.fn(),
      supported: false,
    });

    renderAt("/nearby");

    expect(screen.getByText("Couldn't get your location")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByLabelText("Stop ID")).toBeTruthy();
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
    expect(
      screen.getByText(/Next bus: Route 7 Duval, (tomorrow )?at/)
    ).toBeTruthy();
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
