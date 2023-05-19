import { SnackbarProvider } from "notistack";
import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { SettingsDialog } from "./SettingsDialog";

describe("SettingsDialog", () => {
  test("matches snapshot", async () => {
    const { container } = render(
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        preventDuplicate={true}
        autoHideDuration={2000}
      >
        <SettingsDialog
          open={true}
          autoPolling={false}
          reloadVehiclePositions={jest.fn()}
          setOpen={jest.fn()}
          setAutoPolling={jest.fn()}
        />
      </SnackbarProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("Vehicle Live Position")).toBeInTheDocument()
    );

    expect(container).toMatchSnapshot();
  });
});
