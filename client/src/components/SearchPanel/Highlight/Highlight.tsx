import * as React from "react";
import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";
import { Box } from "@mui/material";

interface HighlightProps {
  text: string;
  query: string;
}

export const Highlight: React.FC<HighlightProps> = ({ text, query }) => {
  const matches = match(text, query, {
    insideWords: true,
  });
  const parts = parse(text, matches);

  return (
    <Box
      component={"span"}
      sx={{
        minWidth: "30px",
        display: "inline-block",
      }}
    >
      {parts.map((part, index) => (
        <span
          key={index}
          style={{
            fontWeight: part.highlight ? 700 : 400,
            fontSize: "14px",
          }}
        >
          {part.text}
        </span>
      ))}
    </Box>
  );
};
