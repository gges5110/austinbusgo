import { SnackbarProvider } from "notistack";
import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { SettingsDialog } from "./SettingsDialog";
import { vitest } from "vitest";

describe("SettingsDialog", () => {
  test("matches snapshot", async () => {
    const { container } = render(
      <SnackbarProvider
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        autoHideDuration={2000}
        maxSnack={3}
        preventDuplicate={true}
      >
        <SettingsDialog
          autoPolling={false}
          open={true}
          reloadVehiclePositions={vitest.fn()}
          setAutoPolling={vitest.fn()}
          setOpen={vitest.fn()}
        />
      </SnackbarProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("Vehicle Live Position")).toBeInTheDocument()
    );

    expect(container).toMatchSnapshot();
  });
});
