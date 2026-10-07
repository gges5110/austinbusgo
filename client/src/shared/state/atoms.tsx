import type { Coordinate } from "features/map/components/Map";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { UpcomingArrival } from "shared/api/generated/model";
import { RecentSearch } from "shared/hooks/UseRecentSearches";
import { Route, Stop, VehiclePosition } from "shared/types/interface.d";

export const settingsDialogOpenAtom = atom<boolean>(false);
export const isAutoPollingAtom = atomWithStorage<boolean>(
  "vehiclePositionAutoPolling",
  false
);
export const showReactQueryDevtoolsAtom = atomWithStorage<boolean>(
  "showReactQueryDevtools",
  false
);
export const recentSearchesAtom = atomWithStorage<Array<RecentSearch>>(
  "recentSearches",
  []
);
export type ColorModeType = "light" | "dark" | "system";
export const colorModeAtom = atomWithStorage<ColorModeType>(
  "colorMode",
  "light"
);

export const hoveringStopAtom = atom<Stop | undefined>(undefined);
export const hoveringVehiclePositionAtom = atom<VehiclePosition | undefined>(
  undefined
);
export const pinnedVehiclePositionAtom = atom<VehiclePosition | undefined>(
  undefined
);

export const mapsFlyToCoordinateAtom = atom<Coordinate | undefined>(undefined);
export type FavoritesType = Stop | Route;

export const favoritesAtom = atomWithStorage<Array<FavoritesType>>(
  "favorites",
  []
);

export const currentRouteAtom = atom<Route | undefined>(undefined);
export const currentStopAtom = atom<Stop | undefined>(undefined);

/**
 * What the Nearby screen wants on the map: its stop's upcoming arrivals and
 * the expanded one. While set, the map shows only these buses.
 */
export interface NearbyFocus {
  stopId: string;
  arrivals: UpcomingArrival[];
  selectedTripId?: string;
  /** The rider's position, framed together with the stop */
  rider?: { latitude: number; longitude: number };
}
export const nearbyFocusAtom = atom<NearbyFocus | undefined>(undefined);
