import { Box, Button, Typography } from "@mui/material";
import React from "react";
import { useNavigate, useRouteError } from "react-router-dom";

export const RouteErrorFallback: React.FC = () => {
  const navigate = useNavigate();
  const error = useRouteError();

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "statusText" in error
        ? (error as { statusText?: string }).statusText
        : "An unexpected error occurred";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: 4,
        textAlign: "center",
      }}
    >
      <Typography variant={"h5"}>Failed to load page</Typography>
      <Typography color={"text.secondary"} variant={"body2"}>
        {errorMessage}
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button onClick={() => navigate(-1)} variant={"outlined"}>
          Go Back
        </Button>
        <Button onClick={() => navigate("/")} variant={"contained"}>
          Home
        </Button>
      </Box>
    </Box>
  );
};
