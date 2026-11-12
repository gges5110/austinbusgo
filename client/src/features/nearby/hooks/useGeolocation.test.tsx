import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useGeolocation } from "./useGeolocation";

const STORAGE_KEY = "nearbyUsesLocation";

const watchPosition = vi.fn();
const clearWatch = vi.fn();

const setPermission = (state: PermissionState | undefined) =>
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value:
      state === undefined
        ? undefined
        : { query: vi.fn().mockResolvedValue({ state }) },
  });

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <JotaiProvider>{children}</JotaiProvider>
);

const render = () => renderHook(() => useGeolocation(), { wrapper });

describe("useGeolocation", () => {
  beforeEach(() => {
    localStorage.clear();
    watchPosition.mockReset().mockReturnValue(1);
    clearWatch.mockReset();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { watchPosition, clearWatch },
    });
  });

  afterEach(() => setPermission(undefined));

  test("first visit: waits for the rider instead of prompting on load", async () => {
    setPermission("prompt");
    const { result } = render();

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(watchPosition).not.toHaveBeenCalled();

    act(() => result.current.request());

    expect(watchPosition).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("locating");
  });

  test("starts on its own when the browser already allows location", async () => {
    setPermission("granted");
    render();

    await waitFor(() => expect(watchPosition).toHaveBeenCalled());
  });

  test("starts on its own for a rider who used it before", async () => {
    setPermission("prompt");
    localStorage.setItem(STORAGE_KEY, "true");
    render();

    await waitFor(() => expect(watchPosition).toHaveBeenCalled());
  });

  test("remembers the opt-in once a position arrives", async () => {
    setPermission("prompt");
    const { result } = render();
    await waitFor(() => expect(result.current.status).toBe("idle"));

    act(() => result.current.request());
    const onPosition = watchPosition.mock.calls[0][0];
    act(() =>
      onPosition({
        coords: { latitude: 30.27, longitude: -97.74, accuracy: 12 },
      })
    );

    expect(result.current.status).toBe("granted");
    expect(result.current.position).toEqual({
      latitude: 30.27,
      longitude: -97.74,
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  test("reports a blocked site without prompting", async () => {
    setPermission("denied");
    const { result } = render();

    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(watchPosition).not.toHaveBeenCalled();
  });

  test("no Permissions API: waits for the rider", async () => {
    setPermission(undefined);
    const { result } = render();

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(watchPosition).not.toHaveBeenCalled();
  });
});
