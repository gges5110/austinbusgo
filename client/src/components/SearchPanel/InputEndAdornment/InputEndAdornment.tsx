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
      <Tooltip placement={"bottom-end"} title={"Search"}>
        <IconButton
          onClick={() => {
            if (inputString !== "") {
              goToSearchPage();
            }
          }}
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
      <Divider orientation={"vertical"} style={{ height: 28 }} />

      {inputString === "" ? (
        <Box component={"div"} sx={{ padding: "10px 10px" }}>
          <Tooltip placement={"bottom-end"} title={"Start search"}>
            <Button
              color={"neutral"}
              onClick={() => {
                focusAutocomplete();
              }}
              size={"small"}
              sx={{
                width: 34,
                height: 28,
                minWidth: "unset",
                borderRadius: "7px",
                "&:hover": {
                  color: "#2196f3",
                },
              }}
              variant={"outlined"}
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
