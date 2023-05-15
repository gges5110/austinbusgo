import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface InputEndAdornmentProps {
  loading: boolean;
  inputString: string | undefined;

  clearSelection(): void;

  goToSearchPage(): void;

  focusAutocomplete(): void;
}

export const InputEndAdornment: React.FC<InputEndAdornmentProps> = ({
  inputString,
  clearSelection,
  loading,
  goToSearchPage,
  focusAutocomplete,
}) => {
  return (
    <>
      <Tooltip title="Search" placement="bottom-end">
        <IconButton
          sx={{
            "&:hover": {
              color: "#2196f3",
              backgroundColor: "unset",
            },
            padding: "12px 15px",
          }}
          onClick={() => {
            if (inputString !== "") {
              goToSearchPage();
            }
          }}
        >
          <SearchIcon />
        </IconButton>
      </Tooltip>
      <Divider style={{ height: 28 }} orientation="vertical" />

      {inputString === "" ? (
        <Box component={"div"} sx={{ padding: "10px 10px" }}>
          <Tooltip title="Start search" placement="bottom-end">
            <Button
              variant="outlined"
              color={"neutral"}
              size="small"
              onClick={() => {
                focusAutocomplete();
              }}
              sx={{
                width: 34,
                height: 28,
                minWidth: "unset",
                borderRadius: "7px",
                "&:hover": {
                  color: "#2196f3",
                },
              }}
            >
              <div>⌘K</div>
            </Button>
          </Tooltip>
        </Box>
      ) : loading ? (
        <Box sx={{ padding: "9px 15px" }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Tooltip title="Clear search" placement="bottom-end">
          <IconButton
            sx={{
              "&:hover": {
                color: "#2196f3",
                backgroundColor: "unset",
              },
              padding: "12px 15px",
            }}
            onClick={clearSelection}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      )}
    </>
  );
};
