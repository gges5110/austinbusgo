import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { Box, Button, Typography } from "@mui/material";
import * as React from "react";
import { FavoritesType } from "shared/state/atoms";
import { useFavorites } from "./useFavorites";

interface AddToFavoritesProps {
  value: FavoritesType;
}

export const AddToFavorites: React.FC<AddToFavoritesProps> = ({ value }) => {
  const { addToFavorites, containsFavorite, removeFromFavorites } =
    useFavorites();
  const alreadyAdded = containsFavorite(value);
  const onClick = () => {
    if (containsFavorite(value)) {
      removeFromFavorites(value);
    } else {
      addToFavorites(value);
    }
  };

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
