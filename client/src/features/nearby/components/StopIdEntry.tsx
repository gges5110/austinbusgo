import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import * as React from "react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

interface StopIdEntryProps {
  /** Larger field when it is the main way forward */
  prominent?: boolean;
}

/** The stop ID printed on CapMetro stop signs; opens that stop pinned. */
export const StopIdEntry: React.FC<StopIdEntryProps> = ({ prominent }) => {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const stopId = value.trim();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (stopId) navigate(`/nearby/stop/${encodeURIComponent(stopId)}`);
  };

  return (
    <Box component={"form"} onSubmit={onSubmit} sx={{ px: 2, py: 1 }}>
      <TextField
        fullWidth={true}
        label={"Stop ID (on the stop sign)"}
        onChange={(event) => setValue(event.target.value)}
        size={prominent ? "medium" : "small"}
        slotProps={{
          htmlInput: { inputMode: "numeric", "aria-label": "Stop ID" },
          input: {
            endAdornment: (
              <InputAdornment position={"end"}>
                <IconButton
                  aria-label={"Go to stop"}
                  disabled={!stopId}
                  edge={"end"}
                  type={"submit"}
                >
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        value={value}
      />
    </Box>
  );
};
