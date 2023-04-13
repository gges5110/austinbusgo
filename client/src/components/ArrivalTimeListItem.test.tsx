import * as React from "react";
import { arrivalTimesMock } from "../mockData/ArrivalTime.mock";
import { ArrivalTimeListItem } from "./ArrivalTimeListItem";
import { render } from "@testing-library/react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

describe("ArrivalTimeListItem", () => {
  test("matches snapshot", () => {
    const { container } = render(
      <ArrivalTimeListItem
        arrivalTime={arrivalTimesMock[0]}
        arrivalTimeOnClick={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
