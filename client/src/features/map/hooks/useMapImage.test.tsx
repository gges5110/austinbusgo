import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { GeneratedImage, useMapImage } from "./useMapImage";

const mocks = vi.hoisted(() => {
  const map = {
    hasImage: vi.fn(() => false),
    addImage: vi.fn(),
    isStyleLoaded: vi.fn(() => true),
    once: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  return { map, useMap: vi.fn(() => ({ mapId: map })) };
});

vi.mock("react-map-gl/mapbox", () => ({
  useMap: mocks.useMap,
}));

const image: GeneratedImage = {
  width: 2,
  height: 2,
  data: new Uint8ClampedArray(16),
};
const createImage = vi.fn(() => image);

describe("useMapImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.map.hasImage.mockReturnValue(false);
    mocks.map.isStyleLoaded.mockReturnValue(true);
    mocks.useMap.mockReturnValue({ mapId: mocks.map });
    createImage.mockReturnValue(image);
  });

  test("adds the image when the style is loaded", () => {
    renderHook(() => useMapImage("img", createImage, true));

    expect(mocks.map.addImage).toHaveBeenCalledWith(
      "img",
      expect.objectContaining({ width: 2, height: 2 }),
      { sdf: true }
    );
  });

  test("defers to the load event when the style is not ready", () => {
    mocks.map.isStyleLoaded.mockReturnValue(false);

    renderHook(() => useMapImage("img", createImage));

    expect(mocks.map.addImage).not.toHaveBeenCalled();
    expect(mocks.map.once).toHaveBeenCalledWith("load", expect.any(Function));

    mocks.map.once.mock.calls[0][1]();
    expect(mocks.map.addImage).toHaveBeenCalled();
  });

  test("does not re-add an existing image", () => {
    mocks.map.hasImage.mockReturnValue(true);

    renderHook(() => useMapImage("img", createImage));

    expect(mocks.map.addImage).not.toHaveBeenCalled();
    expect(createImage).not.toHaveBeenCalled();
  });

  test("re-adds the image when the style reports it missing", () => {
    mocks.map.hasImage.mockReturnValue(true);
    renderHook(() => useMapImage("img", createImage));
    expect(mocks.map.addImage).not.toHaveBeenCalled();

    const onImageMissing = mocks.map.on.mock.calls.find(
      (c) => c[0] === "styleimagemissing"
    )?.[1];
    mocks.map.hasImage.mockReturnValue(false);
    onImageMissing({ id: "img" });

    expect(mocks.map.addImage).toHaveBeenCalled();
  });

  test("skips when the factory returns null (e.g. no canvas context)", () => {
    createImage.mockReturnValue(null as unknown as GeneratedImage);

    renderHook(() => useMapImage("img", createImage));

    expect(mocks.map.addImage).not.toHaveBeenCalled();
  });
});
