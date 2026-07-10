import { renderHook } from "@testing-library/react";
import { RecentSearch } from "shared/hooks/UseRecentSearches";
import { Route, Stop } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { toSearchOption } from "./searchPanelUtils";
import { useSearchOptions } from "./useSearchOptions";

const mocks = vi.hoisted(() => ({
  useRecentSearches: vi.fn(),
}));

vi.mock("shared/hooks/UseRecentSearches", () => ({
  useRecentSearches: mocks.useRecentSearches,
}));

const route = { routeId: "10", routeLongName: "South Congress" } as Route;
const stop = { stopId: "1001", stopName: "First & Main" } as Stop;

const recentSearch = (value: RecentSearch["value"]): RecentSearch => ({
  timestamp: 0,
  value,
});

const renderOptions = (
  params: Partial<Parameters<typeof useSearchOptions>[0]> = {}
) => {
  // Built once so the hook's memo dependencies stay referentially stable
  // across rerenders, like they do in the app
  const props: Parameters<typeof useSearchOptions>[0] = {
    inputString: "",
    stops: [],
    routes: [],
    value: null,
    ...params,
  };
  return renderHook(() => useSearchOptions(props));
};

describe("useSearchOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useRecentSearches.mockReturnValue({
      recentSearches: [],
      removeFromRecentSearches: vi.fn(),
    });
  });

  test("shows recent searches when the input is empty", () => {
    mocks.useRecentSearches.mockReturnValue({
      recentSearches: [recentSearch(route), recentSearch(stop)],
      removeFromRecentSearches: vi.fn(),
    });

    const { result } = renderOptions();

    expect(result.current.options).toHaveLength(2);
    expect(result.current.options[0]).toMatchObject({
      kind: "route",
      recent: true,
    });
    expect(result.current.options[1]).toMatchObject({
      kind: "stop",
      recent: true,
    });
  });

  test("caps overflowing recents at 7 plus a view-all option", () => {
    mocks.useRecentSearches.mockReturnValue({
      recentSearches: Array.from({ length: 10 }, (_, i) =>
        recentSearch({ value: `term-${i}` })
      ),
      removeFromRecentSearches: vi.fn(),
    });

    const { result } = renderOptions();

    expect(result.current.options).toHaveLength(8);
    expect(result.current.options[7].kind).toBe("viewAll");
    expect(result.current.options[6]).toMatchObject({
      kind: "term",
      term: "term-6",
    });
  });

  test("maps routes before stops when the input has text", () => {
    const { result } = renderOptions({
      inputString: "1",
      routes: [route],
      stops: [stop],
    });

    expect(result.current.options.map((o) => o.kind)).toEqual([
      "route",
      "stop",
    ]);
    expect(result.current.options[0].recent).toBe(false);
  });

  test("falls back to the current value when there are no results", () => {
    const value = toSearchOption(route);
    const { result } = renderOptions({ inputString: "zzz", value });

    expect(result.current.options).toEqual([value]);
  });

  test("returns a stable reference when inputs do not change", () => {
    const { result, rerender } = renderOptions({
      inputString: "1",
      routes: [route],
    });
    const first = result.current.options;
    rerender();

    expect(result.current.options).toBe(first);
  });
});
