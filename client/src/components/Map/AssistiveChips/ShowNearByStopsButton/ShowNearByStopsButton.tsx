import * as React from "react";
import { MouseEventHandler } from "react";
import { LoadingButton } from "@mui/lab";
import NearMeIcon from "@mui/icons-material/NearMe";
import { Paper, Typography } from "@mui/material";

interface ShowNearByStopsButtonProps {
  isLoading?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
}

export const ShowNearByStopsButton: React.FC<ShowNearByStopsButtonProps> = ({
  isLoading,
  onClick,
}) => {
  return (
    <Paper
      sx={{
        backgroundColor: "background.default",
        borderRadius: "32px",
      }}
    >
      <LoadingButton
        loading={isLoading}
        sx={{
          whiteSpace: "nowrap",
          color: "text.primary",
          textTransform: "none",
        }}
        onClick={onClick}
      >
        <NearMeIcon sx={{ fontSize: 18 }} />
        <Typography fontSize={14} fontWeight={500}>
          Show nearby stops
        </Typography>
      </LoadingButton>
    </Paper>
  );
};
