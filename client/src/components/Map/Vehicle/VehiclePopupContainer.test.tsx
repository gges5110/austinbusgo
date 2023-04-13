import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { stopQuery } from "../../../mockData/Stop.mock";
import { tripQuery } from "../../../mockData/Trip.mock";
import { vehiclePositionMock } from "../../../mockData/VehiclePosition.mock";
import { StopDocument } from "../../../schemas/Stop.generated";
import { TripDocument } from "../../../schemas/Trip.generated";
import { VehiclePopupContainer } from "./VehiclePopupContainer";
import { MockedProvider } from "@apollo/client/testing";

const mocks = [
  {
    request: {
      query: TripDocument,
      variables: { tripId: vehiclePositionMock.trip?.tripId },
    },
    result: {
      data: tripQuery,
    },
  },
  {
    request: {
      query: StopDocument,
      variables: { stopId: vehiclePositionMock.stopId },
    },
    result: {
      data: stopQuery,
    },
  },
];

describe("VehiclePopupContainer", () => {
  test("calls the query method on Apollo Client", async () => {
    const { container } = render(
      <MockedProvider
        mocks={mocks}
        defaultOptions={{
          watchQuery: { fetchPolicy: "no-cache" },
        }}
      >
        <VehiclePopupContainer vehiclePosition={vehiclePositionMock} />
      </MockedProvider>
    );

    await waitFor(() =>
      expect(
        screen.getByText(stopQuery.stop.stopName || "")
      ).toBeInTheDocument()
    );

    expect(container).toMatchSnapshot();
  });
});
