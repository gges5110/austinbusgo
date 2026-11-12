import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, test, vi } from "vitest";

import { DirectionToggle } from "./DirectionToggle";

const trip = (
  directionId: number,
  tripShortName: string,
  tripHeadsign: string
) => ({
  routeId: "x",
  serviceId: "s",
  tripId: `t${directionId}`,
  directionId,
  tripShortName,
  tripHeadsign,
});

const r801 = { routeId: "801", routeLongName: "801-N Lamar S Congress" };

describe("DirectionToggle", () => {
  test("names directions by destination, and switches", async () => {
    const setDirection = vi.fn();
    render(
      <DirectionToggle
        directionId={0}
        distinctTrips={[
          trip(0, "Tech Ridge Park & Ride", "801 Tech Ridge Park & Ride NB"),
          trip(1, "Southpark Meadows", "801 Southpark Meadows SB"),
        ]}
        route={r801}
        setDirection={setDirection}
      />
    );

    const north = screen.getByRole("button", {
      name: /To Tech Ridge Park & Ride\s*Northbound/,
    });
    expect(north).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(
      screen.getByRole("button", { name: /To Southpark Meadows\s*Southbound/ })
    );
    expect(setDirection).toHaveBeenCalledWith(1);
  });

  test("tells apart two directions with the same destination", () => {
    render(
      <DirectionToggle
        directionId={0}
        distinctTrips={[
          trip(0, "Eastside Bus Plaza", "2 Eastside Bus Plaza KB"),
          trip(1, "Eastside Bus Plaza", "2 Eastside Bus Plaza CB"),
        ]}
        route={{ routeId: "2", routeLongName: "2- Rosewood/Cesar Chavez" }}
        setDirection={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /Direction 1/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Direction 2/ })).toBeTruthy();
  });

  test("same destination but different compass words keeps them", () => {
    render(
      <DirectionToggle
        directionId={0}
        distinctTrips={[
          trip(0, "Downtown", "9 Downtown NB"),
          trip(1, "Downtown", "9 Downtown SB"),
        ]}
        route={{ routeId: "9", routeLongName: "9-Example" }}
        setDirection={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /To Downtown\s*Northbound/ })
    ).toBeTruthy();
    expect(screen.queryByText(/Direction 1/)).toBeNull();
  });

  test("a garbled direction in the URL selects the first", () => {
    render(
      <DirectionToggle
        directionId={NaN}
        distinctTrips={[
          trip(0, "Tech Ridge Park & Ride", "801 Tech Ridge Park & Ride NB"),
          trip(1, "Southpark Meadows", "801 Southpark Meadows SB"),
        ]}
        route={r801}
        setDirection={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /To Tech Ridge Park & Ride/ })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("reselecting the current direction keeps it", async () => {
    const setDirection = vi.fn();
    render(
      <DirectionToggle
        directionId={0}
        distinctTrips={[
          trip(0, "Tech Ridge Park & Ride", "801 Tech Ridge Park & Ride NB"),
          trip(1, "Southpark Meadows", "801 Southpark Meadows SB"),
        ]}
        route={r801}
        setDirection={setDirection}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: /To Tech Ridge Park & Ride/ })
    );
    expect(setDirection).not.toHaveBeenCalled();
  });
});
