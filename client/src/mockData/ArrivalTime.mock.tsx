import dayjs from "dayjs";
import MockDate from "mockdate";
import { ArrivalTime, VehicleStopStatus } from "../interfaces/interface.d";

MockDate.set("2020-11-22");

export const arrivalTimesMock: ArrivalTime[] = [
  {
    updatedArrivalTime: dayjs(new Date())
      .subtract(20, "minute")
      .format("HH:mm:ss"),
    scheduledArrivalTime: dayjs(new Date())
      .subtract(20, "minute")
      .format("HH:mm:ss"),
    trip: {
      routeId: "1",
      serviceId: "5-133_MRG_2",
      tripId: "2277200_MRG_2",
      tripHeadsign: "1-Lamar/South Congress SB",
      tripShortName: "William Cannon",
      directionId: false,
      blockId: "1008-5-133_MRG_2",
      shapeId: "42692",
      wheelchairAccessible: 1,
      bikesAllowed: 1,
      __typename: "Trip",
    },
    vehicle: {
      trip: {
        tripId: "2279155_MRG_6",
        routeId: "2",
        startDate: "20200403",
        __typename: "TripDescriptor",
      },
      vehicle: {
        id: "2253",
        label: "2253",
        __typename: "VehicleDescriptor",
      },
      position: {
        latitude: 30.268808364868164,
        longitude: -97.72804260253906,
        __typename: "Position",
      },
      stopId: "3731",
      currentStatus: VehicleStopStatus.StoppedAt,
      timestamp: dayjs(new Date()).unix() - 120,
      __typename: "VehiclePosition",
    },
  },
  {
    updatedArrivalTime: dayjs(new Date())
      .subtract(20, "minute")
      .format("HH:mm:ss"),
    scheduledArrivalTime: dayjs(new Date())
      .subtract(20, "minute")
      .format("HH:mm:ss"),
    trip: {
      routeId: "1",
      serviceId: "5-133_MRG_2",
      tripId: "2277200_MRG_2",
      tripHeadsign: "1-Lamar/South Congress SB",
      tripShortName: "William Cannon",
      directionId: false,
      blockId: "1008-5-133_MRG_2",
      shapeId: "42692",
      wheelchairAccessible: 1,
      bikesAllowed: 1,
      __typename: "Trip",
    },
    vehicle: {
      trip: {
        tripId: "2279154_MRG_6",
        routeId: "2",
        startDate: "20200403",
        __typename: "TripDescriptor",
      },
      vehicle: {
        id: "2308",
        label: "2308",
        __typename: "VehicleDescriptor",
      },
      position: {
        latitude: 30.270435333251953,
        longitude: -97.69692993164062,
        __typename: "Position",
      },
      stopId: "634",
      currentStatus: VehicleStopStatus.InTransitTo,
      timestamp: dayjs(new Date()).unix() - 120,
      __typename: "VehiclePosition",
    },
  },
  {
    updatedArrivalTime: dayjs(new Date())
      .subtract(20, "minute")
      .format("HH:mm:ss"),
    scheduledArrivalTime: dayjs(new Date())
      .subtract(20, "minute")
      .format("HH:mm:ss"),
    trip: {
      routeId: "1",
      serviceId: "5-133_MRG_2",
      tripId: "2277200_MRG_2",
      tripHeadsign: "1-Lamar/South Congress SB",
      tripShortName: "William Cannon",
      directionId: false,
      blockId: "1008-5-133_MRG_2",
      shapeId: "42692",
      wheelchairAccessible: 1,
      bikesAllowed: 1,
      __typename: "Trip",
    },
    vehicle: {
      trip: {
        tripId: "2279153_MRG_6",
        routeId: "2",
        startDate: "20200403",
        __typename: "TripDescriptor",
      },
      vehicle: {
        id: "2356",
        label: "2356",
        __typename: "VehicleDescriptor",
      },
      position: {
        latitude: 30.273550033569336,
        longitude: -97.69136047363281,
        __typename: "Position",
      },
      stopId: "669",
      currentStatus: VehicleStopStatus.StoppedAt,
      timestamp: dayjs(new Date()).unix() - 120,
      __typename: "VehiclePosition",
    },
  },
];
export const arrivalTimeWithoutUpdateMock: ArrivalTime = {
  updatedArrivalTime: "",
  scheduledArrivalTime: dayjs(new Date())
    .subtract(20, "minute")
    .format("HH:mm:ss"),
  trip: {
    routeId: "1",
    serviceId: "5-133_MRG_2",
    tripId: "2277200_MRG_2",
    tripHeadsign: "1-Lamar/South Congress SB",
    tripShortName: "William Cannon",
    directionId: false,
    blockId: "1008-5-133_MRG_2",
    shapeId: "42692",
    wheelchairAccessible: 1,
    bikesAllowed: 1,
    __typename: "Trip",
  },
  vehicle: {
    trip: {
      tripId: "2279155_MRG_6",
      routeId: "2",
      startDate: "20200403",
      __typename: "TripDescriptor",
    },
    vehicle: {
      id: "2253",
      label: "2253",
      __typename: "VehicleDescriptor",
    },
    position: {
      latitude: 30.268808364868164,
      longitude: -97.72804260253906,
      __typename: "Position",
    },
    stopId: "3731",
    currentStatus: VehicleStopStatus.StoppedAt,
    timestamp: dayjs(new Date()).unix() - 120,
    __typename: "VehiclePosition",
  },
};
