import { CircularProgress } from "@mui/material";
import * as React from "react";

interface LoadingSnackbarMessageProps {
  readonly message: string;
}

export const LoadingSnackbarMessage: React.FunctionComponent<LoadingSnackbarMessageProps> = ({
  message,
}) => (
  <React.Fragment>
    {message}
    <CircularProgress
      color={"secondary"}
      size={24}
      style={{ marginLeft: 16 }}
    />
  </React.Fragment>
);
