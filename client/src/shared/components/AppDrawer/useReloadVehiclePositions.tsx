import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";

export const useReloadVehiclePositions = () => {
  const { routeId, directionId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const reloadVehiclePositions = () => {
    enqueueSnackbar("Reloading Vehicles...", {
      variant: "info",
    });
    queryClient.invalidateQueries({
      queryKey: [
        "VehiclePositions",
        {
          routeId: routeId,
          direction: Number(directionId),
        },
      ],
    });
  };

  return { reloadVehiclePositions };
};
