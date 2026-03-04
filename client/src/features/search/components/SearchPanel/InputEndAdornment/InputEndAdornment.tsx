import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import * as React from "react";

interface InputEndAdornmentProps {
  loading: boolean;
  inputString: string | undefined;

  clearSelection(): void;
}

export const InputEndAdornment: React.FC<InputEndAdornmentProps> = ({
  inputString,
  clearSelection,
  loading,
}) => {
  return (
    <>
      {inputString === "" ? (
        <Tooltip placement={"bottom-end"} title={"Search"}>
          <IconButton
            aria-label={"Search"}
            sx={{
              "&:hover": {
                color: "primary.main",
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
          <CircularProgress aria-label={"Loading"} size={24} />
        </Box>
      ) : (
        <Tooltip placement={"bottom-end"} title={"Clear search"}>
          <IconButton
            aria-label={"Clear search"}
            onClick={clearSelection}
            sx={{
              "&:hover": {
                color: "primary.main",
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
