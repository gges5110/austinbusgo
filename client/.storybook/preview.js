import React from "react";
import { ThemeProvider } from "@material-ui/core/styles";
import { theme } from "../src/Theming";

const withThemeProvider = (Story, context) => {
  return (
    <ThemeProvider theme={theme}>
      <Story {...context} />
    </ThemeProvider>
  );
};
export const decorators = [withThemeProvider];
