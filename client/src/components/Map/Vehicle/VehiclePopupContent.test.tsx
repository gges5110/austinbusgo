import React from "react";
import { stopQuery } from "../../../mockData/Stop.mock";
import { tripQuery } from "../../../mockData/Trip.mock";
import { vehiclePositionMock } from "../../../mockData/VehiclePosition.mock";
import { VehiclePopupContent } from "./VehiclePopupContent";
import { render } from "@testing-library/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

describe("VehiclePopupContent", () => {
  test("matches snapshot", () => {
    const { container } = render(
      <VehiclePopupContent
        vehiclePosition={vehiclePositionMock}
        stop={stopQuery}
        stopLoading={false}
        trip={tripQuery}
        tripLoading={false}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
