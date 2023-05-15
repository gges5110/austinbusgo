import { act, renderHook } from "@testing-library/react";
import { useViewStateSync } from "./UseViewStateSync";
import React from "react";
import { BrowserRouter } from "react-router-dom";

jest.useFakeTimers();

const mockUserNavigate = jest.fn();
const mockUseNavigation = jest.fn();
jest.mock("react-router-dom", () => ({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockUserNavigate,
  useNavigation: () => mockUseNavigation,
  useLocation: () => ({
    pathname:
      "/@30.1914967,-97.8068439,13.27z/stop/6379/trip/2699464_MRG_3?routeId=318&directionId=1",
  }),
}));
describe("useViewStateSync", () => {
  test("should setViewStateInUrl", () => {
    const viewPort = {
      longitude: 50,
      latitude: 20,
      zoom: 10,
    };
    const { result } = renderHook(() => useViewStateSync(viewPort), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });

    expect(result.current.setViewStateInUrl).toBeDefined();
    act(() => {
      result.current.setViewStateInUrl({
        longitude: 50,
        latitude: 30,
        zoom: 10,
      });
    });
    jest.runAllTimers();

    expect(
      mockUserNavigate
    ).toHaveBeenCalledWith(
      "/@30,50,10z/stop/6379/trip/2699464_MRG_3?routeId=318&directionId=1undefined",
      { replace: true }
    );
  });
});
