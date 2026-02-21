import BookmarkIcon from "@mui/icons-material/Bookmark";
import RouteIcon from "@mui/icons-material/Route";
import {
  Box,
  Button,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import { MENU_PANEL_WIDTH } from "shared/components/MenuPanel/MenuPanel";
import { useViewStatePathname } from "shared/hooks/UseViewStatePathname";

interface AssistiveChipsProps {}

export const AssistiveChips: React.FC<AssistiveChipsProps> = () => {
  const { viewStatePathname } = useViewStatePathname();
  const theme = useTheme();
  // Use 'md' breakpoint to keep chips visible on tablets (sm-md range)
  // while hiding them on smaller mobile devices to prevent overflow
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Hide on mobile screens to prevent overflow
  if (isMobile) {
    return null;
  }

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
        <Button
          component={RouterLink}
          sx={{
            whiteSpace: "nowrap",
            color: "text.primary",
            textTransform: "none",
            px: "12px",
          }}
          to={`/search/All%20routes${viewStatePathname}`}
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
          to={`/favorites${viewStatePathname}`}
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
