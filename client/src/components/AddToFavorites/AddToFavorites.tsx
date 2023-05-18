import * as React from "react";
import { useFavorites } from "../../hooks/UseFavorites";
import { Box, Button, Typography } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { FavoritesType } from "../../Atoms";

interface AddToFavoritesProps {
  value: FavoritesType;
}

export const AddToFavorites: React.FC<AddToFavoritesProps> = ({ value }) => {
  const {
    addToFavorites,
    containsFavorite,
    removeFromFavorites,
  } = useFavorites();
  const alreadyAdded = containsFavorite(value);
  const onClick = () => {
    if (containsFavorite(value)) {
      removeFromFavorites(value);
    } else {
      addToFavorites(value);
    }
  };

  return (
    <Button sx={{ textTransform: "none" }} onClick={onClick}>
      <Box display={"flex"} flexDirection={"column"} alignItems={"center"}>
        {alreadyAdded ? <BookmarkIcon /> : <BookmarkBorderIcon />}
        <Typography sx={{ textAlign: "center", fontSize: "14px" }}>
          {alreadyAdded ? "Saved" : "Save"}
        </Typography>
      </Box>
    </Button>
  );
};
