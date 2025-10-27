import { renderHook } from "@testing-library/react";
import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { useTitle } from "./UseTitle";

describe("useTitle", () => {
  let originalTitle: string;

  beforeEach(() => {
    originalTitle = document.title;
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  test("should set document title", () => {
    const testTitle = "Test Title";

    renderHook(() => useTitle(testTitle));

    expect(document.title).toBe(testTitle);
  });

  test("should update document title when title changes", () => {
    const { rerender } = renderHook(({ title }) => useTitle(title), {
      initialProps: { title: "First Title" },
    });

    expect(document.title).toBe("First Title");

    rerender({ title: "Second Title" });

    expect(document.title).toBe("Second Title");
  });

  test("should restore previous title on unmount", () => {
    const previousTitle = "Previous Title";
    document.title = previousTitle;

    const { unmount } = renderHook(() => useTitle("New Title"));

    expect(document.title).toBe("New Title");

    unmount();

    expect(document.title).toBe(previousTitle);
  });
});
