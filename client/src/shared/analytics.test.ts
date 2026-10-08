import { afterEach, describe, expect, test } from "vitest";

import { initAnalytics } from "./analytics";

const beacon = () =>
  document.head.querySelector<HTMLScriptElement>(
    'script[src*="cloudflareinsights"]'
  );

describe("initAnalytics", () => {
  afterEach(() => beacon()?.remove());

  test("adds the Cloudflare beacon in production with a token", () => {
    expect(initAnalytics("site-token", true)).toBe(true);

    const script = beacon();
    expect(script?.defer).toBe(true);
    expect(JSON.parse(script?.dataset.cfBeacon ?? "{}")).toEqual({
      token: "site-token",
      spa: true,
    });
  });

  test.each([
    ["no token", undefined, true],
    ["development build", "site-token", false],
  ])("does nothing with %s", (_, token, isProduction) => {
    expect(initAnalytics(token, isProduction)).toBe(false);
    expect(beacon()).toBeNull();
  });
});
