import { act, renderHook } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { GeometryType, Stop } from "shared/types/interface.d";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { useCurrentStop } from "./UseCurrentStop";

const mocks = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockUseParams: vi.fn(),
    mockUseDataFromRouteLoader: vi.fn(),
    mockAddToRecentSearches: vi.fn(),
    mockUseViewStatePathname: vi.fn(),
    mockUseAtom: vi.fn(),
  };
});

vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual("react-router-dom")) as object;
  return {
    ...actual,
    useNavigate: () => mocks.mockNavigate,
    useParams: () => mocks.mockUseParams(),
  };
});

vi.mock("app/Router", () => ({
  useDataFromRouteLoader: () => mocks.mockUseDataFromRouteLoader(),
}));

vi.mock("shared/hooks/UseRecentSearches", () => ({
  useRecentSearches: () => ({
    addToRecentSearches: mocks.mockAddToRecentSearches,
  }),
}));

vi.mock("shared/hooks/UseViewStatePathname", () => ({
  useViewStatePathname: () => mocks.mockUseViewStatePathname(),
}));

vi.mock("jotai", async () => {
  const actual = (await vi.importActual("jotai")) as object;
  return {
    ...actual,
    useAtom: () => mocks.mockUseAtom(),
  };
});

describe("useCurrentStop", () => {
  const mockStop: Stop = {
    stopId: "123",
    stopName: "Test Stop",
    stopLoc: {
      type: GeometryType.Point,
      coordinates: [-97.456, 30.123],
    },
  };

  const mockSetCurrentStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUseParams.mockReturnValue({
      routeId: undefined,
      directionId: undefined,
    });
    mocks.mockUseDataFromRouteLoader.mockReturnValue(undefined);
    mocks.mockUseViewStatePathname.mockReturnValue({
      viewStatePathname: "/@30.123,-97.456,13z",
    });
    mocks.mockUseAtom.mockReturnValue([undefined, mockSetCurrentStop]);
  });

  test("should return currentStop from atom", () => {
    mocks.mockUseAtom.mockReturnValue([mockStop, mockSetCurrentStop]);

    const { result } = renderHook(() => useCurrentStop(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    expect(result.current.currentStop).toEqual(mockStop);
  });

  test("should sync stop from loader with atom", () => {
    mocks.mockUseDataFromRouteLoader.mockReturnValue({ stop: mockStop });

    renderHook(() => useCurrentStop(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    expect(mockSetCurrentStop).toHaveBeenCalledWith(mockStop);
  });

  test("should navigate to stop page when setStop is called", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/@30.123,-97.456,13z",
      },
      writable: true,
    });

    const { result } = renderHook(() => useCurrentStop(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    act(() => {
      result.current.setStop(mockStop);
    });

    expect(mocks.mockAddToRecentSearches).toHaveBeenCalledWith(mockStop);
    expect(mockSetCurrentStop).toHaveBeenCalledWith(mockStop);
    expect(mocks.mockNavigate).toHaveBeenCalledWith(
      "/stop/123/@30.123,-97.456,13z"
    );
  });

  test("should navigate to stop page with route context when on route page", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/@30.123,-97.456,13z/route/318",
      },
      writable: true,
    });

    mocks.mockUseParams.mockReturnValue({
      routeId: "318",
      directionId: "1",
    });

    const { result } = renderHook(() => useCurrentStop(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    act(() => {
      result.current.setStop(mockStop);
    });

    expect(mocks.mockAddToRecentSearches).toHaveBeenCalledWith(mockStop);
    expect(mockSetCurrentStop).toHaveBeenCalledWith(mockStop);
    expect(mocks.mockNavigate).toHaveBeenCalledWith(
      "/stop/123/@30.123,-97.456,13z?routeId=318&directionId=1"
    );
  });

  test("should not navigate when stopId is undefined", () => {
    const invalidStop = {
      ...mockStop,
      stopId: (undefined as unknown) as string,
    };

    const { result } = renderHook(() => useCurrentStop(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    act(() => {
      result.current.setStop(invalidStop as Stop);
    });

    expect(mocks.mockAddToRecentSearches).not.toHaveBeenCalled();
    expect(mocks.mockNavigate).not.toHaveBeenCalled();
  });
});
