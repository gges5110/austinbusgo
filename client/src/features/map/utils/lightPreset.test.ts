import { describe, expect, test } from "vitest";

import { getLightPreset } from "./lightPreset";

const at = (hour: number) => new Date(2026, 6, 12, hour, 0, 0);

describe("getLightPreset", () => {
  test("dark mode is always night, regardless of time", () => {
    expect(getLightPreset(true, at(12))).toBe("night");
    expect(getLightPreset(true, at(3))).toBe("night");
  });

  test("light mode follows the local time of day", () => {
    expect(getLightPreset(false, at(6))).toBe("dawn");
    expect(getLightPreset(false, at(12))).toBe("day");
    expect(getLightPreset(false, at(19))).toBe("dusk");
  });

  test("light mode never returns night, even late", () => {
    expect(getLightPreset(false, at(23))).toBe("dusk");
    expect(getLightPreset(false, at(2))).toBe("dusk");
  });
});
