import { atom } from "jotai";
import { RunningTrip } from "./interfaces/interface.d";
import { SearchMode } from "./components/SearchPanel";

export const settingsDialogOpenAtom = atom<boolean>(false);
export const selectedRouteAtom = atom<RunningTrip | undefined>(undefined);
export const searchModeAtom = atom<SearchMode>(SearchMode.Route);
