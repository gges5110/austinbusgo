import AutorenewIcon from "@mui/icons-material/Autorenew";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import CloseIcon from "@mui/icons-material/Close";
import CodeIcon from "@mui/icons-material/Code";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import DeveloperModeIcon from "@mui/icons-material/DeveloperMode";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import RouteIcon from "@mui/icons-material/Route";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  Switch,
  Toolbar,
} from "@mui/material";
import dayjs from "dayjs";
import { useAtom, useSetAtom } from "jotai";
import { useSnackbar } from "notistack";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useFeedInfo } from "shared/api/generated/api";
import { ColorModeToggle } from "shared/components/AppDrawer/ColorModeToggle/ColorModeToggle";
import { useShowAllVehicles } from "shared/hooks/UseShowAllVehicles";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";
import {
  isAutoPollingAtom,
  recentSearchesAtom,
  showReactQueryDevtoolsAtom,
} from "shared/state/atoms";
import { useReloadVehiclePositions } from "./useReloadVehiclePositions";

export interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const AppDrawer: React.FunctionComponent<AppDrawerProps> = ({
  open,
  onClose,
}) => {
  const { reloadVehiclePositions } = useReloadVehiclePositions();
  const { data } = useFeedInfo();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { viewStatePathname } = useViewStatePathname();
  const [autoPolling, setAutoPolling] = useAtom(isAutoPollingAtom);
  const [showAllVehicles, setShowAllVehicles] = useShowAllVehicles();
  const setRecentSearches = useSetAtom(recentSearchesAtom);
  const [showReactQueryDevtools, setShowReactQueryDevtools] = useAtom(
    showReactQueryDevtoolsAtom
  );

  const handleAutoPollingChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    enqueueSnackbar(
      event.target.checked ? "Auto Polling Enabled" : "Auto Polling Disabled"
    );
    setAutoPolling(event.target.checked);
    if (event.target.checked) {
      reloadVehiclePositions();
    }
  };

  return (
    <Drawer
      anchor={"left"}
      onClose={onClose}
      open={open}
      sx={{
        "& .MuiDrawer-paper": {
          borderRadius: "0 10px 10px 0",
          width: "320px",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box>
          <Toolbar>
            <IconButton
              aria-label={"close drawer"}
              edge={"start"}
              onClick={onClose}
              sx={{ ml: "auto" }}
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
          <Divider />
          <List>
            <ListSubheader>Explore</ListSubheader>
            <ListItem disablePadding={true}>
              <ListItemButton
                onClick={() => {
                  navigate(`/search/All%20routes${viewStatePathname}`);
                  onClose();
                }}
              >
                <ListItemIcon>
                  <RouteIcon />
                </ListItemIcon>
                <ListItemText primary={"Search all routes"} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding={true}>
              <ListItemButton
                onClick={() => {
                  navigate(`/favorites${viewStatePathname}`);
                  onClose();
                }}
              >
                <ListItemIcon>
                  <BookmarkIcon />
                </ListItemIcon>
                <ListItemText primary={"Show favorites"} />
              </ListItemButton>
            </ListItem>

            <ListSubheader>Appearance</ListSubheader>
            <ListItem>
              <ListItemIcon>
                <ColorLensIcon />
              </ListItemIcon>
              <ListItemText primary={"Theme"} />
              <ListItemSecondaryAction>
                <ColorModeToggle />
              </ListItemSecondaryAction>
            </ListItem>

            <ListSubheader>Vehicle Live Position</ListSubheader>
            <ListItem>
              <ListItemIcon>
                <DirectionsBusIcon />
              </ListItemIcon>
              <ListItemText primary={"Show all buses"} />
              <ListItemSecondaryAction>
                <Switch
                  checked={showAllVehicles}
                  edge={"end"}
                  inputProps={{ "aria-label": "show all vehicles" }}
                  onChange={(e) => setShowAllVehicles(e.target.checked)}
                  value={"showAllVehicles"}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AutorenewIcon />
              </ListItemIcon>
              <ListItemText primary={"Auto Polling"} />
              <ListItemSecondaryAction>
                <Switch
                  checked={autoPolling}
                  edge={"end"}
                  inputProps={{ "aria-label": "enable auto polling" }}
                  onChange={handleAutoPollingChange}
                  value={"autoPolling"}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem disablePadding={true}>
              <ListItemButton onClick={reloadVehiclePositions}>
                <ListItemIcon>
                  <AutorenewIcon />
                </ListItemIcon>
                <ListItemText primary={"Reload Vehicles"} />
              </ListItemButton>
            </ListItem>

            <ListSubheader>Search</ListSubheader>
            <ListItem disablePadding={true}>
              <ListItemButton
                onClick={() => {
                  setRecentSearches([]);
                  enqueueSnackbar("Recent searches cleared", {
                    variant: "success",
                  });
                }}
              >
                <ListItemIcon>
                  <SearchOffIcon />
                </ListItemIcon>
                <ListItemText primary={"Clear recent searches"} />
              </ListItemButton>
            </ListItem>

            <ListSubheader>Developer</ListSubheader>
            <ListItem>
              <ListItemIcon>
                <DeveloperModeIcon />
              </ListItemIcon>
              <ListItemText primary={"React Query Devtools"} />
              <ListItemSecondaryAction>
                <Switch
                  checked={showReactQueryDevtools}
                  edge={"end"}
                  inputProps={{ "aria-label": "toggle devtools" }}
                  onChange={(event) =>
                    setShowReactQueryDevtools(event.target.checked)
                  }
                  value={"showReactQueryDevtools"}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </Box>
        <Box sx={{ mt: "auto" }}>
          <Divider />
          <List>
            <ListSubheader>About Austin Bus Go</ListSubheader>
            <ListItem disablePadding={true}>
              <ListItemButton
                onClick={() => {
                  window.open("https://github.com/gges5110/austinbusgo");
                }}
              >
                <ListItemIcon>
                  <CodeIcon />
                </ListItemIcon>
                <ListItemText primary={"GitHub Repository"} />
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemText
                primary={"Feed Info"}
                secondary={
                  <Box display={"flex"} flexDirection={"column"} gap={"4px"}>
                    <span>
                      Start Date:{" "}
                      {data?.feedStartDate
                        ? dayjs(data?.feedStartDate, "YYYYMMDD").format("ll")
                        : null}
                    </span>
                    <span>
                      End Date:{" "}
                      {data?.feedEndDate
                        ? dayjs(data?.feedEndDate, "YYYYMMDD").format("ll")
                        : null}
                    </span>
                  </Box>
                }
              />
            </ListItem>
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};
