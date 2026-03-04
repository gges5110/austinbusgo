import { render } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { RoutesSelector } from "./RoutesSelector";

const mockArrivalTimes = [
  {
    trip: {
      routeId: "10",
      tripId: "trip-1",
      route: { routeColor: "0000FF" },
    },
  },
  {
    trip: {
      routeId: "20",
      tripId: "trip-2",
      route: { routeColor: "FF0000" },
    },
  },
] as Parameters<typeof RoutesSelector>[0]["arrivalTimes"];

describe("RoutesSelector accessibility", () => {
  it("has no accessibility violations with all routes selected", async () => {
    const { container } = render(
      <RoutesSelector
        arrivalTimes={mockArrivalTimes}
        selectedRouteIds={["10", "20"]}
        setSelectedRouteIds={vi.fn()}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations with partial selection (shows clear button)", async () => {
    const { container } = render(
      <RoutesSelector
        arrivalTimes={mockArrivalTimes}
        selectedRouteIds={["10"]}
        setSelectedRouteIds={vi.fn()}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("route buttons have aria-pressed reflecting selection state", () => {
    const { getByRole } = render(
      <RoutesSelector
        arrivalTimes={mockArrivalTimes}
        selectedRouteIds={["10"]}
        setSelectedRouteIds={vi.fn()}
      />
    );
    expect(
      getByRole("button", { name: /filter by route 10/i })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      getByRole("button", { name: /filter by route 20/i })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("clear button has accessible label", () => {
    const { getByRole } = render(
      <RoutesSelector
        arrivalTimes={mockArrivalTimes}
        selectedRouteIds={["10"]}
        setSelectedRouteIds={vi.fn()}
      />
    );
    expect(
      getByRole("button", { name: /clear route filter/i })
    ).toBeInTheDocument();
  });
});
