import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import * as React from "react";

interface InputEndAdornmentProps {
  loading: boolean;
  inputString: string | undefined;

  clearSelection(): void;

  goToSearchPage(): void;
}

export const InputEndAdornment: React.FC<InputEndAdornmentProps> = ({
  inputString,
  clearSelection,
  loading,
  goToSearchPage,
}) => {
  return (
    <>
      {inputString === "" ? (
        <Tooltip placement={"bottom-end"} title={"Search"}>
          <IconButton
            sx={{
              "&:hover": {
                color: "#2196f3",
                backgroundColor: "unset",
              },
              padding: "12px 15px",
            }}
          >
            <SearchIcon />
          </IconButton>
        </Tooltip>
      ) : loading ? (
        <Box sx={{ padding: "9px 15px" }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Tooltip placement={"bottom-end"} title={"Clear search"}>
          <IconButton
            onClick={clearSelection}
            sx={{
              "&:hover": {
                color: "#2196f3",
                backgroundColor: "unset",
              },
              padding: "12px 15px",
            }}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};
