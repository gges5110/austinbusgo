import { createTheme, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

import { SearchPanel } from "./SearchPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
const theme = createTheme();
const wrapper = ({ children }: { children: any }) => {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
};
vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual("react-router-dom")) as object;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useNavigation: () => vi.fn(),
  };
});
describe("SearchPanel", () => {
  it("renders", () => {
    render(
      <BrowserRouter>
        <SearchPanel onMenuClick={vi.fn()} />
      </BrowserRouter>,
      { wrapper }
    );
  });
});
