import { Stop } from "../../../interfaces/interface.d";
import * as React from "react";
import { useNearByStops } from "../../../hooks/Map/UseNearByStops";
import { Box } from "@mui/material";
import { MENU_PANEL_WIDTH } from "../../MenuPanel";
import { ViewState } from "../Map";
import { ShowNearByStopsButton } from "./ShowNearByStopsButton/ShowNearByStopsButton";

interface AssistiveChipsProps {
  viewState: ViewState;
  stops: Stop[];
}

export const AssistiveChips: React.FC<AssistiveChipsProps> = ({
  viewState,
  stops,
}) => {
  const { showNearByStopsButton, fetchNearByStops, isLoading } = useNearByStops(
    viewState,
    stops
  );

  return (
    <Box
      sx={{
        position: "absolute",
        left: MENU_PANEL_WIDTH,
        ml: 2,
        mt: 2,
      }}
    >
      {showNearByStopsButton && (
        <ShowNearByStopsButton
          onClick={fetchNearByStops}
          isLoading={isLoading}
        />
      )}
    </Box>
  );
};
