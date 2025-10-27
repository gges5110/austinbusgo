import { renderHook } from "@testing-library/react";
import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { useViewStatePathname } from "./UseViewStatePathname";

describe("useViewStatePathname", () => {
  let originalLocation: Location;

  beforeEach(() => {
    originalLocation = window.location;
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  test("should parse viewStatePathname with coordinates and zoom", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/@30.123,-97.456,13z",
        search: "",
      },
      writable: true,
    });

    const { result } = renderHook(() => useViewStatePathname());

    expect(result.current.viewStatePathname).toBe("/@30.123,-97.456,13z");
    expect(result.current.latitude).toBe(30.123);
    expect(result.current.longitude).toBe(-97.456);
    expect(result.current.zoom).toBe(13);
    expect(result.current.restOfPathname).toBe("");
    expect(result.current.isBasePath).toBe(true);
  });

  test("should parse pathname with route and viewState", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/route/318/@30.123,-97.456,13z",
        search: "",
      },
      writable: true,
    });

    const { result } = renderHook(() => useViewStatePathname());

    expect(result.current.viewStatePathname).toBe("/@30.123,-97.456,13z");
    expect(result.current.latitude).toBe(30.123);
    expect(result.current.longitude).toBe(-97.456);
    expect(result.current.zoom).toBe(13);
    expect(result.current.restOfPathname).toBe("/route/318");
    expect(result.current.isBasePath).toBe(false);
  });

  test("should handle pathname without viewState", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/route/318",
        search: "",
      },
      writable: true,
    });

    const { result } = renderHook(() => useViewStatePathname());

    expect(result.current.viewStatePathname).toBe("");
    expect(result.current.latitude).toBe(0);
    expect(result.current.longitude).toBe(0);
    expect(result.current.zoom).toBe(0);
    expect(result.current.restOfPathname).toBe("/route/318");
    expect(result.current.isBasePath).toBe(false);
  });

  test("should handle root pathname", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/",
        search: "",
      },
      writable: true,
    });

    const { result } = renderHook(() => useViewStatePathname());

    expect(result.current.viewStatePathname).toBe("");
    expect(result.current.latitude).toBe(0);
    expect(result.current.longitude).toBe(0);
    expect(result.current.zoom).toBe(0);
    expect(result.current.restOfPathname).toBe("/");
    expect(result.current.isBasePath).toBe(true);
  });

  test("should parse search params", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/route/318/@30.123,-97.456,13z",
        search: "?routeId=318&directionId=0",
      },
      writable: true,
    });

    const { result } = renderHook(() => useViewStatePathname());

    expect(result.current.searchParams).toBe("?routeId=318&directionId=0");
  });

  test("should handle negative coordinates", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/@-30.123,-97.456,13z",
        search: "",
      },
      writable: true,
    });

    const { result } = renderHook(() => useViewStatePathname());

    expect(result.current.latitude).toBe(-30.123);
    expect(result.current.longitude).toBe(-97.456);
  });

  test("should handle decimal zoom levels", () => {
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/@30.123,-97.456,13.5z",
        search: "",
      },
      writable: true,
    });

    const { result } = renderHook(() => useViewStatePathname());

    expect(result.current.zoom).toBe(13.5);
  });
});
