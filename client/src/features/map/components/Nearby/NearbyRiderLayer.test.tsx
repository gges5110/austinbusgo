import { render } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NearbyRiderLayer } from "./NearbyRiderLayer";

const map = vi.hoisted(() => ({ flyTo: vi.fn(), getZoom: vi.fn(() => 11.5) }));

vi.mock("react-map-gl/mapbox", () => ({
  Layer: () => null,
  Source: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useMap: () => ({ current: map }),
}));

const RIDER = { latitude: 30.21, longitude: -97.84 };

describe("NearbyRiderLayer", () => {
  beforeEach(() => map.flyTo.mockClear());

  it("pans to the rider when there's no stop to frame", () => {
    render(<NearbyRiderLayer pan={true} rider={RIDER} />);

    expect(map.flyTo).toHaveBeenCalledOnce();
    expect(map.flyTo.mock.calls[0][0]).toMatchObject({
      center: [-97.84, 30.21],
      zoom: 15,
    });
  });

  it("pans once, not on every location update", () => {
    const { rerender } = render(<NearbyRiderLayer pan={true} rider={RIDER} />);
    rerender(
      <NearbyRiderLayer pan={true} rider={{ ...RIDER, latitude: 30.22 }} />
    );

    expect(map.flyTo).toHaveBeenCalledOnce();
  });

  it("leaves the camera alone while a stop is framed", () => {
    render(<NearbyRiderLayer pan={false} rider={RIDER} />);

    expect(map.flyTo).not.toHaveBeenCalled();
  });
});
