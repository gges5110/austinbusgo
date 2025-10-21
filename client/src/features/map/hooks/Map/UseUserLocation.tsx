import { useSnackbar } from "notistack";
import { useMap } from "react-map-gl";

import { ViewState } from "../../components/Map/Map";

export const useUserLocation = (viewState: ViewState) => {
  const { enqueueSnackbar } = useSnackbar();
  const { mapId: map } = useMap();
  const userLocationOnClick = () => {
    if (navigator.geolocation) {
      enqueueSnackbar("Retrieving current location...", {
        variant: "info",
      });

      const geoSuccess: PositionCallback = (position) => {
        enqueueSnackbar("Location obtained", {
          variant: "success",
        });

        map?.flyTo({
          center: [
            position.coords.longitude || viewState.longitude,
            position.coords.latitude || viewState.latitude,
          ],
        });
      };
      const geoError: PositionErrorCallback = (error) => {
        console.log("Error occurred. Error code: " + error.code);
        if (error.PERMISSION_DENIED) {
          enqueueSnackbar("Permission denied. Please update the permission.", {
            variant: "warning",
          });
        }
      };
      navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
    } else {
      console.log("Geolocation is not supported for this Browser/OS.");
    }
  };

  return { userLocationOnClick };
};
