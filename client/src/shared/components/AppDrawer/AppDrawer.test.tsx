import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";

import { AppDrawer } from "./AppDrawer";

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual<object>("react-router-dom")),
  useNavigate: () => mocks.navigate,
}));

vi.mock("shared/api/generated/api", () => ({
  useFeedInfo: () => ({ data: undefined }),
}));

vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock("./useReloadVehiclePositions", () => ({
  useReloadVehiclePositions: () => ({ reloadVehiclePositions: vi.fn() }),
}));

describe("AppDrawer", () => {
  test("opens Nearby from the menu", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <AppDrawer onClose={onClose} open={true} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Buses near me" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/nearby");
    expect(onClose).toHaveBeenCalled();
  });
});
