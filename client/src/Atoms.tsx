import { atom } from "jotai";
import { Route, Stop } from "./interfaces/interface.d";
import { atomWithStorage } from "jotai/utils";
import { RecentSearch } from "./hooks/UseRecentSearches";

export const settingsDialogOpenAtom = atom<boolean>(false);
export const selectedRouteAtom = atom<Route | undefined>(undefined);
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
export const nearByStopsAtom = atom<Stop[]>([]);
export const hoveringStopAtom = atom<Stop | undefined>(undefined);
