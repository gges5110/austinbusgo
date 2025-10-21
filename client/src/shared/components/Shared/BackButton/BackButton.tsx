import { useNavigate } from "react-router-dom";
import { IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import * as React from "react";

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
