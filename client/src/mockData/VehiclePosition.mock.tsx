import dayjs from "dayjs";
import MockDate from "mockdate";
import { VehiclePosition, VehicleStopStatus } from "../interfaces/interface.d";
MockDate.set("2020-11-22");

export const vehiclePositionMock: VehiclePosition = {
  trip: {
    tripId: "2437609_MRG_1",
    routeId: "1",
    startDate: "20200819",
    startTime: "",
    __typename: "TripDescriptor",
  },
  vehicle: {
    id: "2054",
    label: "2054",
    licensePlate: "",
    __typename: "VehicleDescriptor",
  },
  position: {
    latitude: 30.27431297302246,
    longitude: -97.744384765625,
    bearing: 197.70184326171875,
    speed: 8.985504150390625,
    __typename: "Position",
  },
  stopId: "2611",
  currentStatus: VehicleStopStatus.InTransitTo,
  timestamp: dayjs(new Date()).unix() - 120,
  congestionLevel: 0,
  __typename: "VehiclePosition",
};
