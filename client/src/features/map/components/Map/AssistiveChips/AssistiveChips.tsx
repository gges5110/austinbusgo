import * as React from "react";
import { useNearByStops } from "../../../hooks/Map/UseNearByStops";
import { Box, Button, Paper, Typography } from "@mui/material";
import { MENU_PANEL_WIDTH } from "../../../../../shared/components/Shared/MenuPanel/MenuPanel";
import { Link as RouterLink } from "react-router-dom";
import { useViewStatePathname } from "../../../../../shared/hooks/UseViewStatePathname";
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
      display={"flex"}
      gap={1}
      sx={{
        position: "absolute",
        left: MENU_PANEL_WIDTH,
        ml: 2,
        mt: 2,
      }}
    >
      <Paper
        sx={{
          backgroundColor: "background.default",
          borderRadius: "32px",
        }}
      >
        <LoadingButton
          component={RouterLink}
          loading={isLoading}
          onClick={fetchNearByStops}
          sx={{
            whiteSpace: "nowrap",
            color: "text.primary",
            textTransform: "none",
          }}
          to={`${viewStatePathname}/search/Nearby%20stops`}
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
          sx={{
            whiteSpace: "nowrap",
            color: "text.primary",
            textTransform: "none",
            px: "12px",
          }}
          to={`${viewStatePathname}/search/All%20routes`}
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
          sx={{
            whiteSpace: "nowrap",
            color: "text.primary",
            textTransform: "none",
            px: "12px",
          }}
          to={`${viewStatePathname}/search/Favorites`}
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
