import { act, renderHook } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

import { useViewStateSync } from "./UseViewStateSync";

const mocks = vi.hoisted(() => {
  return {
    mockUserNavigate: vi.fn(),
    mockUseNavigation: vi.fn(),
  };
});

vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual("react-router-dom")) as object;
  return {
    ...actual,
    useNavigate: () => mocks.mockUserNavigate,
    useNavigation: () => mocks.mockUseNavigation,
  };
});

vi.useFakeTimers();

describe("useViewStateSync", () => {
  test("should setViewStateInUrl", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname:
          "/stop/6379/trip/2699464_MRG_3/@30.1914967,-97.8068439,13.27z",
        search: "?routeId=318&directionId=1",
      },
    });

    const viewPort = {
      longitude: 50,
      latitude: 20,
      zoom: 10,
    };
    const { result } = renderHook(() => useViewStateSync(viewPort), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    expect(result.current.setViewStateInUrl).toBeDefined();
    act(() => {
      result.current.setViewStateInUrl({
        longitude: 50,
        latitude: 30,
        zoom: 10,
      });
    });
    vi.runAllTimers();

    expect(mocks.mockUserNavigate).toHaveBeenCalledWith(
      "/stop/6379/trip/2699464_MRG_3/@30,50,10z?routeId=318&directionId=1",
      { replace: true }
    );
  });
});
