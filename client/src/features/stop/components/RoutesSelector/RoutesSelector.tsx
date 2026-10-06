import ClearIcon from "@mui/icons-material/Clear";
import { Box, Button, IconButton, Typography } from "@mui/material";
import * as React from "react";

export interface RouteOption {
  routeId: string;
  routeColor?: string | null;
}

interface RoutesSelectorProps {
  selectedRouteIds: Array<string>;

  setSelectedRouteIds: (
    arg1: ((prevState: string[]) => string[]) | string[]
  ) => void;

  /** Routes to offer; duplicates are ignored */
  routes: RouteOption[];
}

export const RoutesSelector: React.FC<RoutesSelectorProps> = ({
  selectedRouteIds,
  setSelectedRouteIds,
  routes,
}) => {
  const uniqueRouteIds = [
    ...new Set(routes.map((route) => route.routeId)),
  ].sort((a, b) => Number(a) - Number(b));
  const clearSelection = () => {
    setSelectedRouteIds(uniqueRouteIds);
  };
  return (
    <Box
      sx={{
        alignItems: "center",
        display: "flex",
        justifyContent: "flex-start",
      }}
    >
      <Box sx={{ display: "flex", gap: 1 }}>
        {uniqueRouteIds.map((uniqueRouteId) => {
          const routeColor = routes.find(
            (route) => route.routeId === uniqueRouteId
          )?.routeColor;
          const isSelected = selectedRouteIds.includes(uniqueRouteId);
          // TODO: fix hover styles
          return (
            <Button
              aria-label={`Filter by route ${uniqueRouteId}`}
              aria-pressed={isSelected}
              key={uniqueRouteId}
              onClick={() => {
                setSelectedRouteIds((prevState) => {
                  if (prevState.length === uniqueRouteIds.length) {
                    return [uniqueRouteId];
                  } else if (
                    prevState.includes(uniqueRouteId) &&
                    prevState.length > 1
                  ) {
                    const newArr = [...prevState];
                    newArr.splice(newArr.indexOf(uniqueRouteId), 1);
                    return newArr;
                  } else {
                    const newArr = [...prevState];
                    newArr.push(uniqueRouteId);
                    return newArr;
                  }
                });
              }}
              sx={{
                backgroundColor: `#${routeColor}`,
                "&:hover": {
                  backgroundColor: `#${routeColor}`,
                  opacity: isSelected ? "80%" : "40%",
                },
                color: "white",
                width: "fit-content",
                height: "fit-content",
                px: 1,
                py: 0,
                minWidth: 0,
                borderRadius: 1,
                opacity: isSelected ? "100%" : "50%",
              }}
            >
              <Typography sx={{ fontWeight: "bold" }}>
                {uniqueRouteId}
              </Typography>
            </Button>
          );
        })}
      </Box>
      {uniqueRouteIds.length !== selectedRouteIds.length && (
        <IconButton
          aria-label={"Clear route filter"}
          onClick={() => {
            clearSelection();
          }}
          sx={{ padding: "4px" }}
        >
          <ClearIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
    </Box>
  );
};
