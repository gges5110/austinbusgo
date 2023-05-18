import { atom } from "jotai";
import { Route, Stop, VehiclePosition } from "./interfaces/interface.d";
import { atomWithStorage } from "jotai/utils";
import { RecentSearch } from "./hooks/UseRecentSearches";
import { Coordinate } from "./components/Map/Map";

export const settingsDialogOpenAtom = atom<boolean>(false);
export const isAutoPollingAtom = atomWithStorage<boolean>(
  "vehiclePositionAutoPolling",
  false
);
export const recentSearchesAtom = atomWithStorage<Array<RecentSearch>>(
  "recentSearches",
  []
);
export const colorModeAtom = atomWithStorage<"light" | "dark">(
  "colorMode",
  "light"
);

export const selectedRouteIdsAtStopAtom = atom<string[]>([]);
export const hoveringStopAtom = atom<Stop | undefined>(undefined);
export const hoveringVehiclePositionAtom = atom<VehiclePosition | undefined>(
  undefined
);

export const mapsFlyToCoordinateAtom = atom<Coordinate | undefined>(undefined);
export type FavoritesType = Stop | Route;

export const favoritesAtom = atomWithStorage<Array<FavoritesType>>(
  "favorites",
  []
);
