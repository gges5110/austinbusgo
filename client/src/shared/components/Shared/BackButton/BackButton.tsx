import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton, Tooltip } from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";

export const BackButton = () => {
  const navigate = useNavigate();
  const onBack = () => {
    navigate(-1);
  };

  return (
    <Tooltip sx={{ position: "absolute", left: "6px" }} title={"Back"}>
      <IconButton onClick={onBack}>
        <ArrowBackIcon />
      </IconButton>
    </Tooltip>
  );
};
