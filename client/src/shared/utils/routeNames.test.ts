import { describe, expect, test } from "vitest";

import { directionLabel, routeDisplayName } from "./routeNames";

describe("routeDisplayName", () => {
  test.each([
    ["640", "640-Forty Acres", "Forty Acres"],
    ["2", "2- Rosewood/Cesar Chavez", "Rosewood/Cesar Chavez"],
    ["335", "335 35th/38th", "35th/38th"],
    ["800", "800 PLEASANT VALLEY", "PLEASANT VALLEY"],
    ["7", "Duval", "Duval"],
    ["7", "7", "7"],
    ["3", "3rd Street", "3rd Street"],
    ["1", "1st/Red River", "1st/Red River"],
  ])("%s %s → %s", (routeId, routeLongName, expected) => {
    expect(routeDisplayName({ routeId, routeLongName })).toBe(expected);
  });
});

describe("directionLabel", () => {
  const r801 = { routeId: "801", routeLongName: "801-N Lamar S Congress" };
  const r640 = { routeId: "640", routeLongName: "640-Forty Acres" };

  test("destination plus compass direction", () => {
    expect(
      directionLabel(
        {
          tripShortName: "Tech Ridge Park & Ride",
          tripHeadsign: "801 Tech Ridge Park & Ride NB",
        },
        r801
      )
    ).toEqual({
      primary: "To Tech Ridge Park & Ride",
      secondary: "Northbound",
    });
  });

  test("loops named after the route read Outbound / Inbound", () => {
    expect(
      directionLabel(
        {
          tripShortName: "Forty Acres-OB",
          tripHeadsign: "640 Forty Acres-OB OB",
        },
        r640
      )
    ).toEqual({ primary: "Outbound" });
    expect(
      directionLabel(
        {
          tripShortName: "Forty Acres-IB",
          tripHeadsign: "640 Forty Acres-IB IB",
        },
        r640
      )
    ).toEqual({ primary: "Inbound" });
  });

  test("no direction code: just the destination", () => {
    expect(
      directionLabel(
        {
          tripShortName: "Southpark Meadows",
          tripHeadsign: "Southpark Meadows",
        },
        r801
      )
    ).toEqual({ primary: "To Southpark Meadows", secondary: undefined });
  });

  test("same destination, different compass directions", () => {
    expect(
      directionLabel(
        { tripShortName: "Downtown", tripHeadsign: "9 Downtown NB" },
        r801
      ).secondary
    ).toBe("Northbound");
  });

  test("nothing to go on", () => {
    expect(directionLabel({}, r801)).toEqual({ primary: "This direction" });
  });
});
