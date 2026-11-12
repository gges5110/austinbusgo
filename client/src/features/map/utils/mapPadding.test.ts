import { setPhoneSheetSize } from "shared/layout/phoneLayout";
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

describe("uiMapPadding follows the phone sheet", () => {
  afterEach(() => {
    setPhoneSheetSize("half");
    vi.restoreAllMocks();
  });

  test("collapsed: only the bar and tab bar are covered", () => {
    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal("innerHeight", 800);
    setPhoneSheetSize("collapsed");
    // 48 bar + 56 tabs + 10 margin
    expect(uiMapPadding().bottom).toBe(114);
  });

  test("full screen or a short window keeps a strip of map", () => {
    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal("innerHeight", 400);
    // Half sheet would need 74 + 286 of 400px; leave 80px of map
    expect(uiMapPadding().bottom).toBe(400 - 74 - 80);
    setPhoneSheetSize("full");
    expect(uiMapPadding().bottom).toBe(400 - 74 - 80);
  });

  test("Nearby: no search bar, its own margin, always half", () => {
    vi.stubGlobal("innerWidth", 390);
    vi.stubGlobal("innerHeight", 800);
    setPhoneSheetSize("full");
    expect(
      uiMapPadding({ margin: 48, searchBar: false, sheet: "half" })
    ).toEqual({ top: 48, left: 48, right: 48, bottom: 440 + 56 + 48 });
  });
});
