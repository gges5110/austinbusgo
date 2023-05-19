import { SnackbarProvider } from "notistack";
import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { SettingsDialog } from "./SettingsDialog";

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
          reloadVehiclePositions={jest.fn()}
          setAutoPolling={jest.fn()}
          setOpen={jest.fn()}
        />
      </SnackbarProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("Vehicle Live Position")).toBeInTheDocument()
    );

    expect(container).toMatchSnapshot();
  });
});
