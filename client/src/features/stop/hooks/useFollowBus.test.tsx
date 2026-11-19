import { act, renderHook } from "@testing-library/react";
import { useFollowBus } from "features/stop/hooks/useFollowBus";
import { createStore, Provider as JotaiProvider } from "jotai";
import * as React from "react";
import { StopUpcoming, UpcomingArrival } from "shared/api/generated/model";
import { nearbyFocusAtom } from "shared/state/atoms";
import { describe, expect, test } from "vitest";

const bus = (tripId: string): UpcomingArrival => ({
  tripId,
  routeId: "801",
  scheduledAt: 1_800_000_000,
  status: "en_route",
});

const upcoming = (...tripIds: string[]) =>
  ({
    stop: { stopId: "5864" },
    arrivals: tripIds.map(bus),
  }) as unknown as StopUpcoming;

const setup = (data: StopUpcoming) => {
  const store = createStore();
  const hook = renderHook(
    ({ data }: { data: StopUpcoming }) => useFollowBus("5864", data),
    {
      initialProps: { data },
      wrapper: ({ children }: React.PropsWithChildren) => (
        <JotaiProvider store={store}>{children}</JotaiProvider>
      ),
    }
  );
  return { ...hook, store };
};

describe("useFollowBus", () => {
  test("leaves the map alone until a bus is tapped", () => {
    const { result, store } = setup(upcoming("a", "b"));

    expect(store.get(nearbyFocusAtom)).toBeUndefined();
    expect(result.current.expandedTripId).toBeUndefined();
  });

  test("tapping a bus shows it on the map; tapping again lets go", () => {
    const { result, store } = setup(upcoming("a", "b"));

    act(() => result.current.toggle("b"));

    expect(result.current.expandedTripId).toBe("b");
    expect(store.get(nearbyFocusAtom)).toMatchObject({
      searchBar: true,
      selectedTripId: "b",
      stopId: "5864",
    });

    act(() => result.current.toggle("b"));
    expect(store.get(nearbyFocusAtom)).toBeUndefined();
  });

  test("tapping the bus on the map opens its row", () => {
    const { result, store } = setup(upcoming("a", "b"));
    act(() => result.current.toggle("a"));

    act(() =>
      store.set(nearbyFocusAtom, (focus) =>
        focus ? { ...focus, selectedTripId: "b" } : focus
      )
    );

    expect(result.current.expandedTripId).toBe("b");
  });

  test("refreshes keep the bus; once it has passed, the map lets go", () => {
    const { rerender, result, store } = setup(upcoming("a", "b"));
    act(() => result.current.toggle("a"));

    rerender({ data: upcoming("a", "b", "c") });
    expect(store.get(nearbyFocusAtom)?.arrivals).toHaveLength(3);

    rerender({ data: upcoming("b", "c") });
    expect(store.get(nearbyFocusAtom)).toBeUndefined();
  });

  test("leaving the stop page clears the map", () => {
    const { result, store, unmount } = setup(upcoming("a"));
    act(() => result.current.toggle("a"));

    unmount();

    expect(store.get(nearbyFocusAtom)).toBeUndefined();
  });
});
