import { Stop } from "../interfaces/interface.d";
import { StopQuery } from "../schemas/Stop.generated";

export const stop: Stop = { stopId: 1234 };
export const stops: Stop[] = [{ stopId: 1234 }, { stopId: 5678 }];
export const stopQuery: StopQuery = {
  stop: {
    stopId: 468,
    stopLat: 30.353139,
    stopLon: -97.706082,
    stopCode: "468",
    stopName: "Lamar/Thurmond",
    __typename: "Stop",
  },
};
