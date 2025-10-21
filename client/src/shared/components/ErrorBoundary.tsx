import { Box, Button, Paper, Typography } from "@mui/material";
import React, { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

interface Props {
  children: ReactNode;
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        p: 2,
      }}
    >
      <Paper
        sx={{
          p: 4,
          maxWidth: 600,
          textAlign: "center",
        }}
      >
        <Typography gutterBottom={true} variant={"h4"}>
          Something went wrong
        </Typography>
        <Typography color={"text.secondary"} sx={{ mb: 3 }} variant={"body1"}>
          {error?.message || "An unexpected error occurred"}
        </Typography>
        <Button onClick={resetErrorBoundary} variant={"contained"}>
          Reload Page
        </Button>
      </Paper>
    </Box>
  );
};

export const ErrorBoundary: React.FC<Props> = ({ children }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error("Uncaught error:", error, errorInfo);
  };

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
};
