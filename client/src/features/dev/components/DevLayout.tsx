import { Box, Container, Paper, Tab, Tabs } from "@mui/material";
import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export const DevLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine which tab is currently active based on the path
  const currentTab = React.useMemo(() => {
    if (location.pathname.includes("/dev/stops")) return "/dev/stops";
    if (location.pathname.includes("/dev/trip-stop-times"))
      return "/dev/trip-stop-times";
    if (location.pathname.includes("/dev/vehicles")) return "/dev/vehicles";
    return false;
  }, [location.pathname]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Paper
        elevation={1}
        square={true}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Container maxWidth={"xl"}>
          <Tabs
            aria-label={"dev page navigation"}
            onChange={handleTabChange}
            value={currentTab}
          >
            <Tab label={"Stops"} value={"/dev/stops"} />
            <Tab label={"Trip Stop Times"} value={"/dev/trip-stop-times"} />
            <Tab label={"Vehicle Positions"} value={"/dev/vehicles"} />
          </Tabs>
        </Container>
      </Paper>
      <Container maxWidth={"xl"}>
        <Outlet />
      </Container>
    </Box>
  );
};
