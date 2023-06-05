import { render } from "@testing-library/react";
import { SearchPanel } from "./SearchPanel";
import { vi } from "vitest";
import * as React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTheme, ThemeProvider } from "@mui/material";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
const theme = createTheme();
const wrapper = ({ children }) => {
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
        <SearchPanel setRoute={vi.fn()} setStop={vi.fn()} />
      </BrowserRouter>,
      { wrapper }
    );
  });
});
