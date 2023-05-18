import * as React from "react";
import { useNearByStops } from "../../../hooks/Map/UseNearByStops";
import { Box, Button, Paper, Typography } from "@mui/material";
import { MENU_PANEL_WIDTH } from "../../MenuPanel";
import { Link as RouterLink } from "react-router-dom";
import { useViewStatePathname } from "../../../hooks/UseViewStatePathname";
import RouteIcon from "@mui/icons-material/Route";
import NearMeIcon from "@mui/icons-material/NearMe";
import { LoadingButton } from "@mui/lab";
import BookmarkIcon from "@mui/icons-material/Bookmark";

interface AssistiveChipsProps {}

export const AssistiveChips: React.FC<AssistiveChipsProps> = () => {
  const { fetchNearByStops, isLoading } = useNearByStops();
  const { viewStatePathname } = useViewStatePathname();

  return (
    <Box
      sx={{
        position: "absolute",
        left: MENU_PANEL_WIDTH,
        ml: 2,
        mt: 2,
      }}
      display={"flex"}
      gap={1}
    >
      <Paper
        sx={{
          backgroundColor: "background.default",
          borderRadius: "32px",
        }}
      >
        <LoadingButton
          loading={isLoading}
          component={RouterLink}
          to={`${viewStatePathname}/search/Nearby%20stops`}
          sx={{
            whiteSpace: "nowrap",
            color: "text.primary",
            textTransform: "none",
          }}
          onClick={fetchNearByStops}
        >
          <NearMeIcon sx={{ fontSize: 18, mr: "4px" }} />
          <Typography fontSize={14} fontWeight={500}>
            Search nearby stops
          </Typography>
        </LoadingButton>
      </Paper>
      <Paper
        sx={{
          backgroundColor: "background.default",
          borderRadius: "32px",
        }}
      >
        <Button
          component={RouterLink}
          to={`${viewStatePathname}/search/All%20routes`}
          sx={{
            whiteSpace: "nowrap",
            color: "text.primary",
            textTransform: "none",
            px: "12px",
          }}
        >
          <RouteIcon sx={{ fontSize: 18, mr: "4px" }} />
          <Typography fontSize={14} fontWeight={500}>
            Search all routes
          </Typography>
        </Button>
      </Paper>
      <Paper
        sx={{
          backgroundColor: "background.default",
          borderRadius: "32px",
        }}
      >
        <Button
          component={RouterLink}
          to={`${viewStatePathname}/search/Favorites`}
          sx={{
            whiteSpace: "nowrap",
            color: "text.primary",
            textTransform: "none",
            px: "12px",
          }}
        >
          <BookmarkIcon sx={{ fontSize: 18, mr: "4px" }} />
          <Typography fontSize={14} fontWeight={500}>
            Show favorites
          </Typography>
        </Button>
      </Paper>
    </Box>
  );
};
