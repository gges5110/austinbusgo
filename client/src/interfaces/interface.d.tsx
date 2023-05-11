export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
}

export interface Query {
  __typename?: "Query";
  search: Search;
  stopsAndShapes: StopsAndShapes;
  stop: Stop;
  stopsByName?: Maybe<Array<Stop>>;
  nearByStops: Array<Stop>;
  route: Route;
  routes?: Maybe<Array<Route>>;
  trip: TripWithRoute;
  distinctTrips?: Maybe<Array<Trip>>;
  routeShapes: LineString;
  vehiclePositions?: Maybe<Array<VehiclePosition>>;
  arrivalTimes?: Maybe<Array<ArrivalTime>>;
  stopTimes?: Maybe<Array<StopTimes>>;
  realTimeVehiclePositions?: Maybe<Array<Maybe<VehiclePosition>>>;
}

export interface QuerySearchArgs {
  searchTerm: Scalars["String"];
}

export interface QueryStopsAndShapesArgs {
  routeId: Scalars["String"];
  directionId: Scalars["Int"];
  date: Scalars["String"];
}

export interface QueryStopArgs {
  stopId: Scalars["String"];
}

export interface QueryStopsByNameArgs {
  stopName: Scalars["String"];
}

export interface QueryNearByStopsArgs {
  lat: Scalars["Float"];
  lon: Scalars["Float"];
}

export interface QueryRouteArgs {
  routeId: Scalars["String"];
}

export interface QueryTripArgs {
  tripId: Scalars["String"];
}

export interface QueryDistinctTripsArgs {
  routeId: Scalars["String"];
  date: Scalars["String"];
}

export interface QueryRouteShapesArgs {
  tripId: Scalars["String"];
}

export interface QueryVehiclePositionsArgs {
  routeId: Scalars["String"];
  direction: Scalars["Int"];
}

export interface QueryArrivalTimesArgs {
  stopId: Scalars["String"];
  date: Scalars["String"];
}

export interface QueryStopTimesArgs {
  tripId: Scalars["String"];
}

export interface Search {
  __typename?: "Search";
  stops: Array<Stop>;
  routes: Array<Route>;
}

export interface Stop {
  __typename?: "Stop";
  /** Identifies a stop, station, or station entrance. */
  stopId: Scalars["String"];
  /** Short text or a number that identifies the location for riders. */
  stopCode?: Maybe<Scalars["String"]>;
  /** Name of the location. Use a name that people will understand in the local and tourist vernacular. */
  stopName?: Maybe<Scalars["String"]>;
  /** Stop Location. GeoJSON string. */
  stopLoc?: Maybe<Point>;
}

/** Point Scalar Description */
export interface Point {
  __typename?: "Point";
  type: GeometryType;
  coordinates: Array<Scalars["Float"]>;
}

export enum GeometryType {
  Point = "Point",
  LineString = "LineString",
  MultiPoint = "MultiPoint",
  MultiLineString = "MultiLineString",
  Polygon = "Polygon",
  MultiPolygon = "MultiPolygon",
  GeometryCollection = "GeometryCollection",
}

export interface Route {
  __typename?: "Route";
  /** Identifies a route. */
  routeId: Scalars["String"];
  /** Agency for the specified route. */
  agencyId?: Maybe<Scalars["Int"]>;
  /** Short name of a route. */
  routeShortName?: Maybe<Scalars["String"]>;
  /** Full name of a route. */
  routeLongName: Scalars["String"];
  /** Route color designation that matches public facing material. */
  routeColor?: Maybe<Scalars["String"]>;
  /** Description of a route that provides useful, quality information. */
  routeDesc?: Maybe<Scalars["String"]>;
}

export interface StopsAndShapes {
  __typename?: "StopsAndShapes";
  stops: Array<Stop>;
  shapes: Array<LineString>;
}

/** LineString Scalar Description */
export interface LineString {
  __typename?: "LineString";
  type: GeometryType;
  coordinates: Array<Array<Scalars["Float"]>>;
}

export interface TripWithRoute {
  __typename?: "TripWithRoute";
  /** Identifies a route. */
  routeId: Scalars["String"];
  /** Identifies a set of dates when service is available for one or more routes. */
  serviceId: Scalars["String"];
  /** Identifies a trip. */
  tripId: Scalars["String"];
  /** Text that appears on signage identifying the trip's destination to riders. */
  tripHeadsign?: Maybe<Scalars["String"]>;
  /** Public facing text used to identify the trip to riders, for instance, to identify train numbers for commuter rail trips. */
  tripShortName?: Maybe<Scalars["String"]>;
  /** Indicates the direction of travel for a trip. */
  directionId?: Maybe<Scalars["Int"]>;
  /** Identifies the block to which the trip belongs. */
  blockId?: Maybe<Scalars["String"]>;
  /** Identifies a geospatial shape describing the vehicle travel path for a trip. */
  shapeId?: Maybe<Scalars["String"]>;
  /** Indicates wheelchair accessibility. */
  wheelchairAccessible?: Maybe<Scalars["Int"]>;
  /** Indicates whether bikes are allowed. */
  bikesAllowed?: Maybe<Scalars["Int"]>;
  route: Route;
}

export interface Trip {
  __typename?: "Trip";
  /** Identifies a route. */
  routeId: Scalars["String"];
  /** Identifies a set of dates when service is available for one or more routes. */
  serviceId: Scalars["String"];
  /** Identifies a trip. */
  tripId: Scalars["String"];
  /** Text that appears on signage identifying the trip's destination to riders. */
  tripHeadsign?: Maybe<Scalars["String"]>;
  /** Public facing text used to identify the trip to riders, for instance, to identify train numbers for commuter rail trips. */
  tripShortName?: Maybe<Scalars["String"]>;
  /** Indicates the direction of travel for a trip. */
  directionId?: Maybe<Scalars["Int"]>;
  /** Identifies the block to which the trip belongs. */
  blockId?: Maybe<Scalars["String"]>;
  /** Identifies a geospatial shape describing the vehicle travel path for a trip. */
  shapeId?: Maybe<Scalars["String"]>;
  /** Indicates wheelchair accessibility. */
  wheelchairAccessible?: Maybe<Scalars["Int"]>;
  /** Indicates whether bikes are allowed. */
  bikesAllowed?: Maybe<Scalars["Int"]>;
}

export interface VehiclePosition {
  __typename?: "VehiclePosition";
  /** The Trip that this vehicle is serving. Can be empty or partial if the vehicle can not be identified with a given trip instance. */
  trip?: Maybe<TripDescriptor>;
  /** Additional information on the vehicle that is serving this trip. Each entry should have a unique vehicle id. */
  vehicle?: Maybe<VehicleDescriptor>;
  /** Current position of this vehicle. */
  position?: Maybe<Position>;
  /** The stop sequence index of the current stop. The meaning of current_stop_sequence (i.e., the stop that it refers to) is determined by current_status. If current_status is missing IN_TRANSIT_TO is assumed. */
  currentStopSequence?: Maybe<Scalars["Int"]>;
  /** Identifies the current stop. The value must be the same as in stops.txt in the corresponding GTFS feed. */
  stopId?: Maybe<Scalars["String"]>;
  /** The exact status of the vehicle with respect to the current stop. Ignored if current_stop_sequence is missing. */
  currentStatus?: Maybe<VehicleStopStatus>;
  /** Moment at which the vehicle's position was measured. In POSIX time (i.e., number of seconds since January 1st 1970 00:00:00 UTC). */
  timestamp?: Maybe<Scalars["Int"]>;
  congestionLevel?: Maybe<Scalars["Int"]>;
}

/** A descriptor that identifies a single instance of a GTFS trip. */
export interface TripDescriptor {
  __typename?: "TripDescriptor";
  /** The trip_id from the GTFS feed that this selector refers to. */
  tripId?: Maybe<Scalars["String"]>;
  /** The start date of this trip instance in YYYYMMDD format. */
  startDate?: Maybe<Scalars["String"]>;
  /** The initially scheduled start time of this trip instance. The field type Time defines the format of this field, for example 11:15:35 or 25:15:35. */
  startTime?: Maybe<Scalars["String"]>;
  /** The route_id from the GTFS feed that this selector refers to. If trip_id is omitted, then route_id, direction_id, start_time, and schedule_relationship=SCHEDULED must all be set to identify a trip instance. */
  routeId?: Maybe<Scalars["String"]>;
}

export interface VehicleDescriptor {
  __typename?: "VehicleDescriptor";
  /** Internal system identification of the vehicle. Should be unique per vehicle, and is used for tracking the vehicle as it proceeds through the system. This id should not be made visible to the end-user; for that purpose use the label field */
  id?: Maybe<Scalars["String"]>;
  /** User visible label, i.e., something that must be shown to the passenger to help identify the correct vehicle. */
  label?: Maybe<Scalars["String"]>;
  /** The license plate of the vehicle. */
  licensePlate?: Maybe<Scalars["String"]>;
}

export interface Position {
  __typename?: "Position";
  /** Degrees North, in the WGS-84 coordinate system. */
  latitude: Scalars["Float"];
  /** Degrees East, in the WGS-84 coordinate system. */
  longitude: Scalars["Float"];
  /** Bearing, in degrees, clockwise from True North, i.e., 0 is North and 90 is East. This can be the compass bearing, or the direction towards the next stop or intermediate location. This should not be deduced from the sequence of previous positions, which clients can compute from previous data. */
  bearing?: Maybe<Scalars["Float"]>;
  /** Momentary speed measured by the vehicle, in meters per second. */
  speed?: Maybe<Scalars["Float"]>;
}

export enum VehicleStopStatus {
  /** The vehicle is just about to arrive at the stop (on a stop display, the vehicle symbol typically flashes).  */
  IncomingAt = "INCOMING_AT",
  /** The vehicle is standing at the stop. */
  StoppedAt = "STOPPED_AT",
  /** The vehicle has departed the previous stop and is in transit. */
  InTransitTo = "IN_TRANSIT_TO",
}

export interface ArrivalTime {
  __typename?: "ArrivalTime";
  vehicle?: Maybe<VehiclePosition>;
  scheduledArrivalTime: Scalars["String"];
  trip: TripWithRoute;
  updatedArrivalTime?: Maybe<Scalars["String"]>;
}

export interface StopTimes {
  __typename?: "StopTimes";
  tripId: Scalars["String"];
  arrivalTime: Scalars["String"];
  departureTime: Scalars["String"];
  stopId: Scalars["String"];
  stopSequence: Scalars["Int"];
  stopHeadsign?: Maybe<Scalars["String"]>;
  pickupType?: Maybe<Scalars["Int"]>;
  dropOffType?: Maybe<Scalars["Int"]>;
  shapeDistTraveled?: Maybe<Scalars["Float"]>;
  timepoint?: Maybe<Scalars["Int"]>;
  supEstDelay?: Maybe<Scalars["String"]>;
  stop: Stop;
}
