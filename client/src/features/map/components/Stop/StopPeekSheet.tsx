import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Button } from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { MapPeekSheet } from "features/map/components/MapPeekSheet";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import { Stop } from "shared/types/interface.d";

import { StopPopupContent } from "./StopPopupContent";

interface StopPeekSheetProps {
  onClose: () => void;
  open: boolean;
  stop: Stop;
}

export const StopPeekSheet: React.FC<StopPeekSheetProps> = ({
  onClose,
  open,
  stop,
}) => {
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();

  const handleViewStop = () => {
    onClose();
    navigate(`/stop/${stop.stopId}${viewStatePathname}`);
  };

  return (
    <MapPeekSheet onClose={onClose} open={open}>
      <StopPopupContent stop={stop} />
      <Button
        endIcon={<ArrowForwardIcon />}
        fullWidth={true}
        onClick={handleViewStop}
        size={"small"}
        sx={{ mt: 1.5 }}
        variant={"outlined"}
      >
        View arrivals
      </Button>
    </MapPeekSheet>
  );
};
