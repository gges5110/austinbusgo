import { act, renderHook } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useSearchInput } from "./useSearchInput";

const mocks = vi.hoisted(() => ({
  useSearchQuery: vi.fn(),
}));

vi.mock("shared/api/schemas/Search.generated", () => ({
  useSearchQuery: mocks.useSearchQuery,
}));

const changeEvent = { type: "change" } as React.SyntheticEvent;
const blurEvent = { type: "blur" } as React.SyntheticEvent;

describe("useSearchInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.useSearchQuery.mockReturnValue({ data: undefined, isLoading: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("updates the input immediately but debounces the search term", () => {
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.handleInputValueChange(changeEvent, "lam");
    });

    expect(result.current.inputString).toBe("lam");
    expect(mocks.useSearchQuery).toHaveBeenLastCalledWith(
      { searchTerm: "" },
      expect.objectContaining({ enabled: false })
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mocks.useSearchQuery).toHaveBeenLastCalledWith(
      { searchTerm: "lam" },
      expect.objectContaining({ enabled: true, keepPreviousData: true })
    );
  });

  test("ignores blur events", () => {
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.handleInputValueChange(blurEvent, "should not apply");
    });

    expect(result.current.inputString).toBe("");
  });

  test("derives stops and routes from query data", () => {
    const stops = [{ stopId: "1001" }];
    const routes = [{ routeId: "10" }];
    mocks.useSearchQuery.mockReturnValue({
      data: { search: { stops, routes } },
      isLoading: false,
    });

    const { result } = renderHook(() => useSearchInput());

    expect(result.current.stops).toEqual(stops);
    expect(result.current.routes).toEqual(routes);
  });

  test("search() sets the term without debouncing", () => {
    const { result } = renderHook(() => useSearchInput());

    act(() => {
      result.current.search("guadalupe");
    });

    expect(mocks.useSearchQuery).toHaveBeenLastCalledWith(
      { searchTerm: "guadalupe" },
      expect.objectContaining({ enabled: true })
    );
  });

  test("does not report loading while the query is disabled", () => {
    const { result } = renderHook(() => useSearchInput());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.search("guadalupe");
    });

    expect(result.current.isLoading).toBe(true);
  });
});
