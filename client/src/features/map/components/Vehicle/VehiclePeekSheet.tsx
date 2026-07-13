import { MapPeekSheet } from "features/map/components/MapPeekSheet";
import * as React from "react";
import { VehiclePosition } from "shared/types/interface.d";

import { VehiclePopupContainer } from "./VehiclePopupContainer";

interface VehiclePeekSheetProps {
  onClose: () => void;
  open: boolean;
  vehiclePosition: VehiclePosition;
}

export const VehiclePeekSheet: React.FC<VehiclePeekSheetProps> = ({
  onClose,
  open,
  vehiclePosition,
}) => (
  <MapPeekSheet onClose={onClose} open={open}>
    <VehiclePopupContainer vehiclePosition={vehiclePosition} />
  </MapPeekSheet>
);
