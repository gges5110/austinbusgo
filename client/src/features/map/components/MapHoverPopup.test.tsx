import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, test, vi } from "vitest";

import { MapHoverPopup } from "./MapHoverPopup";

const mocks = vi.hoisted(() => ({
  popupProps: vi.fn(),
}));

vi.mock("react-map-gl/mapbox", () => ({
  Popup: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => {
    mocks.popupProps(props);
    return <div data-testid={"popup"}>{children}</div>;
  },
}));

describe("MapHoverPopup", () => {
  test("renders children inside a non-dismissable popup at the location", () => {
    render(
      <MapHoverPopup
        latitude={30.2}
        longitude={-97.7}
        onMouseEnter={vi.fn()}
        onMouseLeave={vi.fn()}
      >
        <span>Popup content</span>
      </MapHoverPopup>
    );

    expect(screen.getByText("Popup content")).toBeInTheDocument();
    expect(mocks.popupProps).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 30.2,
        longitude: -97.7,
        closeButton: false,
        closeOnClick: false,
        offset: 14,
      })
    );
  });

  test("fires hover callbacks so the popup can stay open under the mouse", () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    render(
      <MapHoverPopup
        latitude={30.2}
        longitude={-97.7}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <span>Popup content</span>
      </MapHoverPopup>
    );

    const wrapper = screen.getByText("Popup content").parentElement as Element;
    fireEvent.mouseEnter(wrapper);
    expect(onMouseEnter).toHaveBeenCalled();
    fireEvent.mouseLeave(wrapper);
    expect(onMouseLeave).toHaveBeenCalled();
  });
});
