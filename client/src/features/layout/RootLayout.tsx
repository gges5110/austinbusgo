import { Box, Popper } from "@mui/material";
import { AssistiveChips } from "features/layout/components/AssistiveChips";
import { Map } from "features/map/components/Map";
import { SearchPanel } from "features/search/components/SearchPanel/SearchPanel";
import * as React from "react";
import { useState } from "react";
import { MapProvider } from "react-map-gl/mapbox";
import { Outlet } from "react-router-dom";
import { AppDrawer } from "shared/components/AppDrawer/AppDrawer";
import { ErrorBoundary } from "shared/components/ErrorBoundary";

export const RootLayout: React.FunctionComponent = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  return (
    <ErrorBoundary>
      <Box sx={{ display: "flex", height: "100%", width: "100%" }}>
        <MapProvider>
          <Map />
        </MapProvider>
        <Popper open={true}>
          <Outlet />
        </Popper>
        <Popper open={true} sx={{ zIndex: 2 }}>
          <SearchPanel onMenuClick={() => setIsDrawerOpen(true)} />
        </Popper>
        <Popper open={true}>
          <AssistiveChips />
        </Popper>

        <AppDrawer onClose={() => setIsDrawerOpen(false)} open={isDrawerOpen} />
      </Box>
    </ErrorBoundary>
  );
};
