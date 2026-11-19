import { useAtom } from "jotai";
import { useEffect } from "react";
import { StopUpcoming } from "shared/api/generated/model";
import { nearbyFocusAtom } from "shared/state/atoms";

/**
 * The stop page's expanded bus, shown on the map the way Nearby shows it:
 * that stop's buses, the tapped one emphasized with its path to the stop,
 * framed together. Lives in nearbyFocusAtom, so tapping a bus on the map
 * opens its row too. Nothing is published until a row is open, so the
 * stop page's own map view is unchanged until then.
 */
export const useFollowBus = (
  stopId: string,
  data: StopUpcoming | undefined
) => {
  const [focus, setFocus] = useAtom(nearbyFocusAtom);
  const ours = focus?.stopId === stopId ? focus : undefined;
  const arrivals = data?.stop.stopId === stopId ? data.arrivals : undefined;

  // Keep the map's buses current across refreshes; let go once the bus
  // has passed (dropped out of the arrivals)
  useEffect(() => {
    if (!arrivals) return;
    setFocus((current) => {
      if (current?.stopId !== stopId) return current;
      return arrivals.some((a) => a.tripId === current.selectedTripId)
        ? { ...current, arrivals }
        : undefined;
    });
  }, [stopId, arrivals, setFocus]);

  useEffect(() => () => setFocus(undefined), [stopId, setFocus]);

  const toggle = (tripId: string) =>
    setFocus(
      ours?.selectedTripId === tripId || !arrivals
        ? undefined
        : { arrivals, searchBar: true, selectedTripId: tripId, stopId }
    );

  return { expandedTripId: ours?.selectedTripId, toggle };
};
