import { afterEach, describe, expect, test, vi } from "vitest";

import { uiMapPadding } from "./mapPadding";

describe("uiMapPadding", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("desktop reserves room for the left menu panel", () => {
    vi.stubGlobal("innerWidth", 1440);
    expect(uiMapPadding().left).toBe(420);
    expect(uiMapPadding().bottom).toBe(10);
  });

  test("mobile frames the map between the search bar and the half sheet", () => {
    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal("innerHeight", 800);
    const padding = uiMapPadding();
    expect(padding.left).toBe(10);
    expect(padding.top).toBe(74);
    // 55% sheet (440) + tab bar (56) + margin (10)
    expect(padding.bottom).toBe(506);
  });
});
