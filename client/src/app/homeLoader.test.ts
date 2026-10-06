import { afterEach, describe, expect, test } from "vitest";

import { homeLoader, shortLinkLoader } from "./homeLoader";

const setWidth = (width: number) =>
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });

describe("homeLoader", () => {
  const originalWidth = window.innerWidth;
  afterEach(() => setWidth(originalWidth));

  test("sends phones to Nearby", () => {
    setWidth(390);

    const response = homeLoader();

    expect(response?.status).toBe(302);
    expect(response?.headers.get("Location")).toBe("/nearby");
  });

  test("keeps desktop on the map", () => {
    setWidth(1280);

    expect(homeLoader()).toBeNull();
  });
});

test("short link opens the pinned stop", () => {
  const response = shortLinkLoader({
    params: { stopId: "1002" },
    request: new Request("http://localhost/s/1002"),
    context: undefined,
  });

  expect(response.headers.get("Location")).toBe("/nearby/stop/1002");
});
