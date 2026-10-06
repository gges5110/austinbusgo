import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { UpcomingArrival } from "shared/api/generated/model";
import { describe, expect, test, vi } from "vitest";

import { UpcomingRow } from "./UpcomingRow";

const NOW = 1_800_000_000;

const liveArrival: UpcomingArrival = {
  tripId: "t1",
  routeId: "801",
  routeColor: "E2231A",
  headsign: "801 Tech Ridge Park & Ride NB",
  directionId: 0,
  scheduledAt: NOW + 5 * 60,
  predictedAt: NOW + 9 * 60,
  stopsAway: 3,
  status: "en_route",
  vehicle: { id: "bus-1", lat: 30.1, lon: -97.8 },
  track: [
    {
      stopId: "a",
      stopName: "Congress/3rd",
      stopSequence: 6,
      at: NOW,
      isVehicleHere: true,
    },
    {
      stopId: "b",
      stopName: "Congress/7th",
      stopSequence: 9,
      at: NOW + 9 * 60,
      isVehicleHere: false,
      stopsHiddenBefore: 2,
    },
  ],
};

const renderRow = (
  arrival: UpcomingArrival,
  props: Partial<React.ComponentProps<typeof UpcomingRow>> = {}
) =>
  render(
    <MemoryRouter>
      <ul>
        <UpcomingRow
          arrival={arrival}
          expanded={false}
          nowSeconds={NOW}
          onToggle={() => undefined}
          stopId={"b"}
          {...props}
        />
      </ul>
    </MemoryRouter>
  );

describe("UpcomingRow", () => {
  test("shows the live countdown and distance", () => {
    renderRow(liveArrival);

    expect(screen.getByText("9 min")).toBeTruthy();
    expect(screen.getByLabelText("9 min, live")).toBeTruthy();
    expect(screen.getByText("3 stops away")).toBeTruthy();
    expect(screen.getByText("Tech Ridge Park & Ride NB")).toBeTruthy();
  });

  test("tapping toggles the row", () => {
    const onToggle = vi.fn();
    renderRow(liveArrival, { onToggle });

    fireEvent.click(screen.getByRole("button", { expanded: false }));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  test("expanded row shows the bus-to-stop track", () => {
    renderRow(liveArrival, { expanded: true });

    expect(screen.getByText("Congress/3rd")).toBeTruthy();
    expect(screen.getByText(/Congress\/7th/)).toBeTruthy();
    expect(screen.getByText("(your stop)", { exact: false })).toBeTruthy();
    expect(screen.getByText("2 more stops")).toBeTruthy();
    expect(screen.getByLabelText("Bus is here")).toBeTruthy();
  });

  test("scheduled-only rows cannot expand", () => {
    renderRow({
      tripId: "t2",
      routeId: "7",
      scheduledAt: NOW + 14 * 60,
      status: "scheduled",
    });

    expect(screen.getByLabelText("14 min, scheduled")).toBeTruthy();
    expect(screen.getByText("Scheduled")).toBeTruthy();
    expect(screen.getByRole("button").getAttribute("aria-disabled")).toBe(
      "true"
    );
  });
});
