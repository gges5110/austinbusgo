import { atom } from "jotai";
import { Route } from "./interfaces/interface.d";
import { atomWithStorage } from "jotai/utils";
import { SearchMode } from "./components/SearchModeToggle/SearchModeToggle";

export const settingsDialogOpenAtom = atom<boolean>(false);
export const selectedRouteAtom = atom<Route | undefined>(undefined);
export const searchModeAtom = atom<SearchMode>(SearchMode.Route);
export const isAutoPollingAtom = atomWithStorage<boolean>(
  "vehiclePositionAutoPolling",
  false
);

export const searchPanelOpenAtom = atom<boolean>(true);
