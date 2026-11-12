import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useGeolocation } from "./useGeolocation";

const STORAGE_KEY = "nearbyUsesLocation";

const watchPosition = vi.fn();
const clearWatch = vi.fn();

/** A fake PermissionStatus whose state the test can change */
const setPermission = (state: PermissionState | undefined) => {
  const listeners = new Set<() => void>();
  const status = {
    state,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  };
  Object.defineProperty(navigator, "permissions", {
    configurable: true,
    value:
      state === undefined
        ? undefined
        : { query: vi.fn().mockResolvedValue(status) },
  });
  return (next: PermissionState) => {
    status.state = next;
    listeners.forEach((listener) => listener());
  };
};

const PERMISSION_DENIED = 1;
const deny = () =>
  watchPosition.mock.calls.at(-1)?.[1]({
    code: PERMISSION_DENIED,
    PERMISSION_DENIED,
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

  test("recovers when the rider allows location in settings", async () => {
    const changePermission = setPermission("denied");
    const { result } = render();
    await waitFor(() => expect(result.current.status).toBe("denied"));

    act(() => changePermission("granted"));

    await waitFor(() => expect(watchPosition).toHaveBeenCalled());
    expect(result.current.status).toBe("locating");
  });

  test("a refusal forgets the opt-in so later visits don't prompt on load", async () => {
    setPermission("prompt");
    localStorage.setItem(STORAGE_KEY, "true");
    render();
    await waitFor(() => expect(watchPosition).toHaveBeenCalled());

    act(() => deny());

    expect(localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  test("no geolocation at all: unavailable, nothing to retry", () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: undefined,
    });
    const { result } = render();

    expect(result.current.status).toBe("unavailable");
    expect(result.current.supported).toBe(false);
  });

  test("no Permissions API: waits for the rider", async () => {
    setPermission(undefined);
    const { result } = render();

    await waitFor(() => expect(result.current.status).toBe("idle"));
    expect(watchPosition).not.toHaveBeenCalled();
  });
});
