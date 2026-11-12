/**
 * Display names for routes and their directions. CapMetro's GTFS repeats
 * the route number in every long name ("640-Forty Acres") and names
 * directions with codes ("Forty Acres-OB", headsign "801 … NB").
 */

interface NamedRoute {
  routeId: string;
  routeLongName?: string | null;
}

/** "640-Forty Acres" → "Forty Acres" (the number is shown next to it) */
export const routeDisplayName = ({ routeId, routeLongName }: NamedRoute) => {
  const name = (routeLongName ?? "").trim();
  // Only a whole leading number: route 3's "3rd Street" keeps its "3"
  const repeatsNumber =
    name.startsWith(routeId) && /^($|[\s-])/.test(name.slice(routeId.length));
  return repeatsNumber
    ? name.slice(routeId.length).replace(/^[\s-]+/, "") || name
    : name;
};

const BOUNDS: Record<string, string> = {
  NB: "Northbound",
  SB: "Southbound",
  EB: "Eastbound",
  WB: "Westbound",
  OB: "Outbound",
  IB: "Inbound",
  CW: "Clockwise",
  CCW: "Counterclockwise",
};

interface DirectionTrip {
  tripShortName?: string | null;
  tripHeadsign?: string | null;
}

export interface DirectionLabel {
  /** "To Tech Ridge Park & Ride", or "Outbound" for loops named after the route */
  primary: string;
  /** "Northbound", when it adds something */
  secondary?: string;
}

/** A direction riders can recognize: where it goes, and which way. */
export const directionLabel = (
  trip: DirectionTrip,
  route: NamedRoute
): DirectionLabel => {
  const code = (trip.tripHeadsign ?? "").trim().split(/\s+/).pop() ?? "";
  const bound = BOUNDS[code.toUpperCase()];
  const destination = (trip.tripShortName ?? "")
    .replace(/-(OB|IB)$/i, "")
    .trim();

  // Loops (UT shuttles) name both directions after the route itself
  const namedAfterRoute =
    destination.toLowerCase() === routeDisplayName(route).toLowerCase();
  if (!destination || namedAfterRoute) {
    return { primary: bound ?? (destination || "This direction") };
  }
  return { primary: `To ${destination}`, secondary: bound };
};
