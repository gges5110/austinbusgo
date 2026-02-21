import { act, renderHook } from "@testing-library/react";
import { SearchTerm } from "features/search/components/SearchPanel/hooks/searchPanelUtils";
import { GeometryType, Route, Stop } from "shared/types/interface.d";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { RecentSearch, useRecentSearches } from "./UseRecentSearches";

const mocks = vi.hoisted(() => {
  return {
    mockUseAtom: vi.fn(),
  };
});

vi.mock("jotai", async () => {
  const actual = (await vi.importActual("jotai")) as object;
  return {
    ...actual,
    useAtom: () => mocks.mockUseAtom(),
  };
});

describe("useRecentSearches", () => {
  const mockRoute: Route = {
    routeId: "318",
    routeLongName: "Test Route",
    routeShortName: "TR",
    routeColor: "#0000FF",
    routeTextColor: "#FFFFFF",
  };

  const mockStop: Stop = {
    stopId: "123",
    stopName: "Test Stop",
    stopLoc: {
      type: GeometryType.Point,
      coordinates: [-97.456, 30.123],
    },
  };

  const mockSearchTerm: SearchTerm = {
    value: "search query",
  };

  let mockRecentSearches: RecentSearch[] = [];
  let mockSetRecentSearches: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRecentSearches = [];
    mockSetRecentSearches = vi.fn((updater) => {
      if (typeof updater === "function") {
        mockRecentSearches = updater(mockRecentSearches);
      } else {
        mockRecentSearches = updater;
      }
    });
    mocks.mockUseAtom.mockReturnValue([
      mockRecentSearches,
      mockSetRecentSearches,
    ]);
  });

  test("should return empty recentSearches initially", () => {
    const { result } = renderHook(() => useRecentSearches());

    expect(result.current.recentSearches).toEqual([]);
  });

  test("should add a route to recent searches", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addToRecentSearches(mockRoute);
    });

    expect(mockSetRecentSearches).toHaveBeenCalled();
    expect(mockRecentSearches).toHaveLength(1);
    expect(mockRecentSearches[0].value).toEqual(mockRoute);
    expect(mockRecentSearches[0].timestamp).toBeDefined();
  });

  test("should add a stop to recent searches", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addToRecentSearches(mockStop);
    });

    expect(mockSetRecentSearches).toHaveBeenCalled();
    expect(mockRecentSearches).toHaveLength(1);
    expect(mockRecentSearches[0].value).toEqual(mockStop);
  });

  test("should add a search term to recent searches", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addToRecentSearches(mockSearchTerm);
    });

    expect(mockSetRecentSearches).toHaveBeenCalled();
    expect(mockRecentSearches).toHaveLength(1);
    expect(mockRecentSearches[0].value).toEqual(mockSearchTerm);
  });

  test("should not add empty search term to recent searches", () => {
    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addToRecentSearches({ value: "" });
    });

    expect(mockSetRecentSearches).not.toHaveBeenCalled();
  });

  test("should move existing route to top when added again", () => {
    const otherRoute: Route = {
      ...mockRoute,
      routeId: "7",
      routeLongName: "Other Route",
    };

    mockRecentSearches = [
      { timestamp: 1000, value: otherRoute },
      { timestamp: 2000, value: mockRoute },
    ];
    mocks.mockUseAtom.mockReturnValue([
      mockRecentSearches,
      mockSetRecentSearches,
    ]);

    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addToRecentSearches(mockRoute);
    });

    expect(mockRecentSearches).toHaveLength(2);
    expect(mockRecentSearches[0].value).toEqual(mockRoute);
    expect(mockRecentSearches[1].value).toEqual(otherRoute);
  });

  test("should move existing stop to top when added again", () => {
    const otherStop: Stop = {
      ...mockStop,
      stopId: "456",
      stopName: "Other Stop",
    };

    mockRecentSearches = [
      { timestamp: 1000, value: otherStop },
      { timestamp: 2000, value: mockStop },
    ];
    mocks.mockUseAtom.mockReturnValue([
      mockRecentSearches,
      mockSetRecentSearches,
    ]);

    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addToRecentSearches(mockStop);
    });

    expect(mockRecentSearches).toHaveLength(2);
    expect(mockRecentSearches[0].value).toEqual(mockStop);
    expect(mockRecentSearches[1].value).toEqual(otherStop);
  });

  test("should move existing search term to top when added again", () => {
    const otherSearchTerm: SearchTerm = { value: "other query" };

    mockRecentSearches = [
      { timestamp: 1000, value: otherSearchTerm },
      { timestamp: 2000, value: mockSearchTerm },
    ];
    mocks.mockUseAtom.mockReturnValue([
      mockRecentSearches,
      mockSetRecentSearches,
    ]);

    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.addToRecentSearches(mockSearchTerm);
    });

    expect(mockRecentSearches).toHaveLength(2);
    expect(mockRecentSearches[0].value).toEqual(mockSearchTerm);
    expect(mockRecentSearches[1].value).toEqual(otherSearchTerm);
  });

  test("should remove route from recent searches", () => {
    mockRecentSearches = [
      { timestamp: 1000, value: mockRoute },
      { timestamp: 2000, value: mockStop },
    ];
    mocks.mockUseAtom.mockReturnValue([
      mockRecentSearches,
      mockSetRecentSearches,
    ]);

    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.removeFromRecentSearches(mockRoute);
    });

    expect(mockRecentSearches).toHaveLength(1);
    expect(mockRecentSearches[0].value).toEqual(mockStop);
  });

  test("should remove stop from recent searches", () => {
    mockRecentSearches = [
      { timestamp: 1000, value: mockRoute },
      { timestamp: 2000, value: mockStop },
    ];
    mocks.mockUseAtom.mockReturnValue([
      mockRecentSearches,
      mockSetRecentSearches,
    ]);

    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.removeFromRecentSearches(mockStop);
    });

    expect(mockRecentSearches).toHaveLength(1);
    expect(mockRecentSearches[0].value).toEqual(mockRoute);
  });

  test("should remove search term from recent searches", () => {
    mockRecentSearches = [
      { timestamp: 1000, value: mockSearchTerm },
      { timestamp: 2000, value: mockStop },
    ];
    mocks.mockUseAtom.mockReturnValue([
      mockRecentSearches,
      mockSetRecentSearches,
    ]);

    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.removeFromRecentSearches(mockSearchTerm);
    });

    expect(mockRecentSearches).toHaveLength(1);
    expect(mockRecentSearches[0].value).toEqual(mockStop);
  });

  test("should handle removing non-existent item", () => {
    mockRecentSearches = [{ timestamp: 1000, value: mockStop }];
    mocks.mockUseAtom.mockReturnValue([
      mockRecentSearches,
      mockSetRecentSearches,
    ]);

    const { result } = renderHook(() => useRecentSearches());

    act(() => {
      result.current.removeFromRecentSearches(mockRoute);
    });

    expect(mockRecentSearches).toHaveLength(1);
    expect(mockRecentSearches[0].value).toEqual(mockStop);
  });
});
