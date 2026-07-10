import { renderHook } from "@testing-library/react";
import { Route, Stop } from "shared/types/interface.d";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { useSearchSync } from "./useSearchSync";

const route = { routeId: "10", routeLongName: "South Congress" } as Route;
const stop = { stopId: "1001", stopName: "First & Main" } as Stop;

const setInputString = vi.fn();
const setValue = vi.fn();
const onOpenChange = vi.fn();
const search = vi.fn();

const renderSync = (params: Partial<Parameters<typeof useSearchSync>[0]>) =>
  renderHook(() =>
    useSearchSync({
      setInputString,
      setValue,
      onOpenChange,
      search,
      ...params,
    })
  );

describe("useSearchSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows the favorites heading on the favorites page", () => {
    renderSync({ isOnFavoritesPage: true, route, stop });

    expect(setInputString).toHaveBeenCalledWith("Favorites");
    expect(setValue).toHaveBeenCalledWith(null);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("shows the recent-searches heading on the recent searches page", () => {
    renderSync({ isOnRecentSearchesPage: true });

    expect(setInputString).toHaveBeenCalledWith("Recent Searches");
    expect(setValue).toHaveBeenCalledWith(null);
  });

  test("syncs the URL search term into input and value", () => {
    renderSync({ searchTerm: "lamar", route, stop });

    expect(setInputString).toHaveBeenCalledWith("lamar");
    expect(setValue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "term", term: "lamar", recent: true })
    );
    expect(search).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("syncs the current stop and warms the search results", () => {
    renderSync({ stop, route });

    expect(setInputString).toHaveBeenCalledWith("1001 First & Main");
    expect(setValue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "stop", recent: true })
    );
    expect(search).toHaveBeenCalledWith("1001 First & Main");
  });

  test("syncs the current route when there is no stop", () => {
    renderSync({ route });

    expect(setInputString).toHaveBeenCalledWith("10 South Congress");
    expect(setValue).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "route", recent: true })
    );
    expect(search).toHaveBeenCalledWith("10 South Congress");
  });

  test("clears the input when there is no URL context", () => {
    renderSync({});

    expect(setInputString).toHaveBeenCalledWith("");
    expect(setValue).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
