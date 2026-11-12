import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { Box, Button, IconButton, Typography } from "@mui/material";
import * as React from "react";
import { FavoritesType } from "shared/state/atoms";
import { track } from "shared/track";
import { useFavorites } from "./useFavorites";

interface AddToFavoritesProps {
  value: FavoritesType;
  /** Icon only, for headers */
  compact?: boolean;
}

export const AddToFavorites: React.FC<AddToFavoritesProps> = ({
  value,
  compact = false,
}) => {
  const { addToFavorites, containsFavorite, removeFromFavorites } =
    useFavorites();
  const alreadyAdded = containsFavorite(value);
  const onClick = () => {
    if (containsFavorite(value)) {
      removeFromFavorites(value);
    } else {
      addToFavorites(value);
      track(
        "save",
        "stopId" in value ? ["stop", value.stopId] : ["route", value.routeId]
      );
    }
  };

  if (compact) {
    return (
      <IconButton
        aria-label={alreadyAdded ? "Saved" : "Save"}
        aria-pressed={alreadyAdded}
        onClick={onClick}
        title={alreadyAdded ? "Saved" : "Save"}
      >
        {alreadyAdded ? <BookmarkIcon /> : <BookmarkBorderIcon />}
      </IconButton>
    );
  }

  return (
    <Button onClick={onClick} sx={{ textTransform: "none" }}>
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {alreadyAdded ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        <Typography sx={{ textAlign: "center", fontSize: "14px" }}>
          {alreadyAdded ? "Saved" : "Save"}
        </Typography>
      </Box>
    </Button>
  );
};
