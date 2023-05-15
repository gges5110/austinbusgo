import { LineString, Stop } from "../../interfaces/interface.d";
import { useMap } from "react-map-gl";
import { useEffect } from "react";
import { vehicleZoomLevel, ViewState } from "../../components/Map/Map";

export const useMapMotion = (
  viewState: ViewState,
  stop: Stop | undefined,
  routeShapes: LineString[]
) => {
  const { mapId: map } = useMap();
  const flyToStop = (stop: Stop) => {
    map?.flyTo({
      center: [
        stop.stopLoc?.coordinates?.[0] || viewState.longitude,
        stop.stopLoc?.coordinates?.[1] || viewState.latitude,
      ],
      zoom: vehicleZoomLevel,
      padding: {
        top: 0,
        left: 420,
        right: 0,
        bottom: 0,
      },
    });
  };

  const flyToRoute = () => {
    if (routeShapes.length !== 0) {
      const flatLineString = routeShapes.flat();
      const coordinates = flatLineString.map((s) => s.coordinates).flat();
      map?.fitBounds(
        [
          [
            Math.min(...coordinates.map((coord) => coord[0])),
            Math.min(...coordinates.map((coord) => coord[1])),
          ],
          [
            Math.max(...coordinates.map((coord) => coord[0])),
            Math.max(...coordinates.map((coord) => coord[1])),
          ],
        ],
        {
          padding: {
            top: 10,
            left: 420,
            right: 10,
            bottom: 10,
          },
        }
      );
    }
  };

  useEffect(() => {
    if (stop) {
      flyToStop(stop);
    } else {
      flyToRoute();
    }
  }, [stop]);

  useEffect(() => {
    if (routeShapes.length !== 0) {
      flyToRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(routeShapes)]);
};
