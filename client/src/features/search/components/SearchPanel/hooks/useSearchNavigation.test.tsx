import { act, renderHook } from "@testing-library/react";
import { Route, Stop } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { toSearchOption } from "./searchPanelUtils";
import { useSearchNavigation } from "./useSearchNavigation";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setRoute: vi.fn(),
  setStop: vi.fn(),
  addToRecentSearches: vi.fn(),
  useCurrentRoute: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("shared/hooks/UseCurrentRoute", () => ({
  useCurrentRoute: mocks.useCurrentRoute,
}));

vi.mock("shared/hooks/UseCurrentStop", () => ({
  useCurrentStop: () => ({ setStop: mocks.setStop }),
}));

vi.mock("shared/hooks/UseRecentSearches", () => ({
  useRecentSearches: () => ({
    addToRecentSearches: mocks.addToRecentSearches,
  }),
}));

vi.mock("shared/hooks/UseViewStatePathname", () => ({
  useViewStatePathname: () => ({ viewStatePathname: "/@30.2,-97.7,12z" }),
}));

const route = { routeId: "10", routeLongName: "South Congress" } as Route;
const stop = { stopId: "1001", stopName: "First & Main" } as Stop;

describe("useSearchNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useCurrentRoute.mockReturnValue({
      currentRoute: undefined,
      setRoute: mocks.setRoute,
    });
  });

  test("selecting a route sets it and records the recent search", () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.handleSelect(toSearchOption(route));
    });

    expect(mocks.setRoute).toHaveBeenCalledWith(route);
    expect(mocks.addToRecentSearches).toHaveBeenCalledWith(route);
  });

  test("selecting the already-current route is a no-op", () => {
    mocks.useCurrentRoute.mockReturnValue({
      currentRoute: route,
      setRoute: mocks.setRoute,
    });
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.handleSelect(toSearchOption(route));
    });

    expect(mocks.setRoute).not.toHaveBeenCalled();
    expect(mocks.addToRecentSearches).not.toHaveBeenCalled();
  });

  test("selecting a stop sets it and records the recent search", () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.handleSelect(toSearchOption(stop));
    });

    expect(mocks.setStop).toHaveBeenCalledWith(stop);
    expect(mocks.addToRecentSearches).toHaveBeenCalledWith(stop);
  });

  test("selecting a term navigates to the search page", () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.handleSelect(toSearchOption({ value: "north lamar" }));
    });

    expect(mocks.navigate).toHaveBeenCalledWith(
      "/search/north%20lamar/@30.2,-97.7,12z"
    );
  });

  test("selecting view-all navigates to recent searches", () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.handleSelect(toSearchOption({ type: "viewAll" }));
    });

    expect(mocks.navigate).toHaveBeenCalledWith(
      "/recent-searches/@30.2,-97.7,12z"
    );
  });

  test("handleClear navigates to the current view state", () => {
    const { result } = renderHook(() => useSearchNavigation());

    act(() => {
      result.current.handleClear();
    });

    expect(mocks.navigate).toHaveBeenCalledWith("/@30.2,-97.7,12z");
  });
});
