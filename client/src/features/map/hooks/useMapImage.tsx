import { useEffect } from "react";
import { useMap } from "react-map-gl/mapbox";

export interface GeneratedImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * Adds a programmatically generated image to the map style once it has
 * loaded, so symbol layers can reference it via icon-image. The factory
 * must be a stable (module-level) function.
 */
export const useMapImage = (
  imageId: string,
  createImage: () => GeneratedImage | null,
  sdf = false
) => {
  const { mapId: map } = useMap();

  useEffect(() => {
    if (!map) return;
    const addImage = () => {
      if (map.hasImage(imageId)) return;
      const image = createImage();
      if (!image) return;
      map.addImage(
        imageId,
        {
          width: image.width,
          height: image.height,
          data: image.data as unknown as Uint8Array,
        },
        { sdf }
      );
    };
    // A layer can request the image before the style has loaded it;
    // styleimagemissing closes that race
    const onImageMissing = (e: { id: string }) => {
      if (e.id === imageId) addImage();
    };
    map.on("styleimagemissing", onImageMissing);
    if (map.isStyleLoaded()) {
      addImage();
    } else {
      map.once("load", addImage);
    }
    return () => {
      map.off("styleimagemissing", onImageMissing);
    };
  }, [map, imageId, createImage, sdf]);
};
