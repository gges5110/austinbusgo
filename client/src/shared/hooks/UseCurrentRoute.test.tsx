import { act, renderHook } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Route } from "shared/types/interface.d";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { useCurrentRoute } from "./UseCurrentRoute";

const mocks = vi.hoisted(() => {
  return {
    mockNavigate: vi.fn(),
    mockUseDataFromRouteLoader: vi.fn(),
    mockUseViewStatePathname: vi.fn(),
    mockUseAtom: vi.fn(),
  };
});

vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual("react-router-dom")) as object;
  return {
    ...actual,
    useNavigate: () => mocks.mockNavigate,
  };
});

vi.mock("app/Router", () => ({
  useDataFromRouteLoader: (key: string) =>
    mocks.mockUseDataFromRouteLoader(key),
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

describe("useCurrentRoute", () => {
  const mockRoute: Route = {
    routeId: "318",
    routeLongName: "Test Route",
    routeShortName: "TR",
    routeColor: "#0000FF",
  };

  const mockSetCurrentRoute = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUseDataFromRouteLoader.mockReturnValue(undefined);
    mocks.mockUseViewStatePathname.mockReturnValue({
      viewStatePathname: "/@30.123,-97.456,13z",
    });
    mocks.mockUseAtom.mockReturnValue([undefined, mockSetCurrentRoute]);
  });

  test("should return currentRoute from atom", () => {
    mocks.mockUseAtom.mockReturnValue([mockRoute, mockSetCurrentRoute]);

    const { result } = renderHook(() => useCurrentRoute(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    expect(result.current.currentRoute).toEqual(mockRoute);
  });

  test("should sync route from route loader with atom", () => {
    mocks.mockUseDataFromRouteLoader.mockImplementation((key: string) => {
      if (key === "route") return { route: mockRoute };
      return undefined;
    });

    renderHook(() => useCurrentRoute(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    expect(mockSetCurrentRoute).toHaveBeenCalledWith(mockRoute);
  });

  test("should sync route from searchParams loader with atom", () => {
    mocks.mockUseDataFromRouteLoader.mockImplementation((key: string) => {
      if (key === "searchParams") return { route: mockRoute };
      return undefined;
    });

    renderHook(() => useCurrentRoute(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    expect(mockSetCurrentRoute).toHaveBeenCalledWith(mockRoute);
  });

  test("should prioritize searchParams route over route loader", () => {
    const routeLoaderRoute: Route = {
      ...mockRoute,
      routeId: "7",
      routeLongName: "Route Loader Route",
    };

    mocks.mockUseDataFromRouteLoader.mockImplementation((key: string) => {
      if (key === "route") return { route: routeLoaderRoute };
      if (key === "searchParams") return { route: mockRoute };
      return undefined;
    });

    renderHook(() => useCurrentRoute(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    expect(mockSetCurrentRoute).toHaveBeenCalledWith(mockRoute);
  });

  test("should navigate to route page when setRoute is called", () => {
    const { result } = renderHook(() => useCurrentRoute(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    act(() => {
      result.current.setRoute(mockRoute);
    });

    expect(mockSetCurrentRoute).toHaveBeenCalledWith(mockRoute);
    expect(mocks.mockNavigate).toHaveBeenCalledWith(
      "/route/318/direction/0/@30.123,-97.456,13z"
    );
  });

  test("should navigate to route page without viewState", () => {
    mocks.mockUseViewStatePathname.mockReturnValue({
      viewStatePathname: "",
    });

    const { result } = renderHook(() => useCurrentRoute(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    act(() => {
      result.current.setRoute(mockRoute);
    });

    expect(mockSetCurrentRoute).toHaveBeenCalledWith(mockRoute);
    expect(mocks.mockNavigate).toHaveBeenCalledWith("/route/318/direction/0");
  });

  test("should not navigate when route is falsy", () => {
    const { result } = renderHook(() => useCurrentRoute(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    // Clear the initial useEffect call
    mockSetCurrentRoute.mockClear();
    mocks.mockNavigate.mockClear();

    act(() => {
      result.current.setRoute(null as unknown as Route);
    });

    expect(mockSetCurrentRoute).not.toHaveBeenCalled();
    expect(mocks.mockNavigate).not.toHaveBeenCalled();
  });

  test("should update atom when route changes", () => {
    const { rerender } = renderHook(() => useCurrentRoute(), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    expect(mockSetCurrentRoute).toHaveBeenCalledWith(undefined);

    mocks.mockUseDataFromRouteLoader.mockImplementation((key: string) => {
      if (key === "route") return { route: mockRoute };
      return undefined;
    });

    rerender();

    expect(mockSetCurrentRoute).toHaveBeenCalledWith(mockRoute);
  });
});
