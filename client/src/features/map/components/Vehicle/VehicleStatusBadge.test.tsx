import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { VehicleStopStatus } from "shared/types/interface.d";
import { VehicleStatusBadge } from "./VehicleStatusBadge";

describe("VehicleStatusBadge", () => {
  it("renders IN TRANSIT for InTransitTo status", () => {
    const { container } = render(
      <VehicleStatusBadge status={VehicleStopStatus.InTransitTo} />
    );
    expect(container.textContent).toBe("IN TRANSIT");
  });

  it("renders ARRIVING for IncomingAt status", () => {
    const { container } = render(
      <VehicleStatusBadge status={VehicleStopStatus.IncomingAt} />
    );
    expect(container.textContent).toBe("ARRIVING");
  });

  it("renders STOPPED for StoppedAt status", () => {
    const { container } = render(
      <VehicleStatusBadge status={VehicleStopStatus.StoppedAt} />
    );
    expect(container.textContent).toBe("STOPPED");
  });

  it("renders nothing for null status", () => {
    const { container } = render(<VehicleStatusBadge status={null} />);
    expect(container.textContent).toBe("");
  });

  it("renders nothing for undefined status", () => {
    const { container } = render(<VehicleStatusBadge status={undefined} />);
    expect(container.textContent).toBe("");
  });

  it("applies correct color for InTransitTo status", () => {
    const { container } = render(
      <VehicleStatusBadge status={VehicleStopStatus.InTransitTo} />
    );
    const box = container.querySelector("div");
    expect(box).toHaveStyle({ backgroundColor: "#4caf50" }); // Green
  });

  it("applies correct color for IncomingAt status", () => {
    const { container } = render(
      <VehicleStatusBadge status={VehicleStopStatus.IncomingAt} />
    );
    const box = container.querySelector("div");
    expect(box).toHaveStyle({ backgroundColor: "#ff9800" }); // Orange
  });

  it("applies correct color for StoppedAt status", () => {
    const { container } = render(
      <VehicleStatusBadge status={VehicleStopStatus.StoppedAt} />
    );
    const box = container.querySelector("div");
    expect(box).toHaveStyle({ backgroundColor: "#f44336" }); // Red
  });
});
