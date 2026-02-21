export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type ArrivalTime = {
  __typename?: "ArrivalTime";
  scheduledArrivalTime: Scalars["String"]["output"];
  trip: Trip;
  updatedArrivalTime?: Maybe<Scalars["String"]["output"]>;
};

export type ArrivalTimeAtStop = {
  __typename?: "ArrivalTimeAtStop";
  scheduledArrivalTime: Scalars["String"]["output"];
  /** Identifies a stop, station, or station entrance. */
  stopId: Scalars["String"]["output"];
  stopSequence: Scalars["Int"]["output"];
  tripId?: Maybe<Scalars["String"]["output"]>;
  updatedArrivalTime?: Maybe<Scalars["String"]["output"]>;
};

export type FeedInfo = {
  __typename?: "FeedInfo";
  feedEndDate?: Maybe<Scalars["String"]["output"]>;
  feedLang: Scalars["String"]["output"];
  feedPublisherName: Scalars["String"]["output"];
  feedPublisherUrl: Scalars["String"]["output"];
  feedStartDate?: Maybe<Scalars["String"]["output"]>;
  feedVersion?: Maybe<Scalars["String"]["output"]>;
};

export enum GeometryType {
  GeometryCollection = "GeometryCollection",
  LineString = "LineString",
  MultiLineString = "MultiLineString",
  MultiPoint = "MultiPoint",
  MultiPolygon = "MultiPolygon",
  Point = "Point",
  Polygon = "Polygon",
}

/** LineString Scalar Description */
export type LineString = {
  __typename?: "LineString";
  coordinates: Array<Array<Scalars["Float"]["output"]>>;
  type: GeometryType;
};

/** Point Scalar Description */
export type Point = {
  __typename?: "Point";
  coordinates: Array<Scalars["Float"]["output"]>;
  type: GeometryType;
};

export type Position = {
  __typename?: "Position";
  /** Bearing, in degrees, clockwise from True North, i.e., 0 is North and 90 is East. This can be the compass bearing, or the direction towards the next stop or intermediate location. This should not be deduced from the sequence of previous positions, which clients can compute from previous data. */
  bearing?: Maybe<Scalars["Float"]["output"]>;
  /** Degrees North, in the WGS-84 coordinate system. */
  latitude: Scalars["Float"]["output"];
  /** Degrees East, in the WGS-84 coordinate system. */
  longitude: Scalars["Float"]["output"];
  /** Momentary speed measured by the vehicle, in meters per second. */
  speed?: Maybe<Scalars["Float"]["output"]>;
};

export type Query = {
  __typename?: "Query";
  arrivalTimes: Array<ArrivalTime>;
  distinctTrips: Array<Trip>;
  earliestArrivalTimesOnRoute: Array<ArrivalTimeAtStop>;
  feedInfo: FeedInfo;
  nearByStops: Array<Stop>;
  realTimeVehiclePositions: Array<Maybe<VehiclePosition>>;
  route: Route;
  routeShapes: LineString;
  routes: Array<Route>;
  search: Search;
  stop: Stop;
  stopTimes: Array<StopTimes>;
  stopsAndShapes: StopsAndShapes;
  stopsByName: Array<Stop>;
  trip: Trip;
  tripIdsForRoute: TripIdsForRoute;
  tripUpdate?: Maybe<TripUpdate>;
  tripUpdates: Array<TripUpdate>;
  vehiclePositions: Array<VehiclePosition>;
};

export type QueryArrivalTimesArgs = {
  date: Scalars["String"]["input"];
  stopId: Scalars["String"]["input"];
};

export type QueryDistinctTripsArgs = {
  date: Scalars["String"]["input"];
  routeId: Scalars["String"]["input"];
};

export type QueryEarliestArrivalTimesOnRouteArgs = {
  date: Scalars["String"]["input"];
  directionId: Scalars["Int"]["input"];
  routeId: Scalars["String"]["input"];
  time: Scalars["String"]["input"];
};

export type QueryNearByStopsArgs = {
  lat: Scalars["Float"]["input"];
  lon: Scalars["Float"]["input"];
};

export type QueryRouteArgs = {
  routeId: Scalars["String"]["input"];
};

export type QueryRouteShapesArgs = {
  tripId: Scalars["String"]["input"];
};

export type QuerySearchArgs = {
  searchTerm: Scalars["String"]["input"];
};

export type QueryStopArgs = {
  stopId: Scalars["String"]["input"];
};

export type QueryStopTimesArgs = {
  tripId: Scalars["String"]["input"];
};

export type QueryStopsAndShapesArgs = {
  date: Scalars["String"]["input"];
  directionId: Scalars["Int"]["input"];
  routeId: Scalars["String"]["input"];
};

export type QueryStopsByNameArgs = {
  stopName: Scalars["String"]["input"];
};

export type QueryTripArgs = {
  tripId: Scalars["String"]["input"];
};

export type QueryTripIdsForRouteArgs = {
  date: Scalars["String"]["input"];
  routeId: Scalars["String"]["input"];
};

export type QueryTripUpdateArgs = {
  tripId: Scalars["String"]["input"];
};

export type QueryTripUpdatesArgs = {
  filter?: InputMaybe<TripUpdatesFilter>;
};

export type QueryVehiclePositionsArgs = {
  direction: Scalars["Int"]["input"];
  routeId: Scalars["String"]["input"];
};

export type Route = {
  __typename?: "Route";
  /** Agency for the specified route. */
  agencyId?: Maybe<Scalars["String"]["output"]>;
  /** Route color designation that matches public facing material. */
  routeColor?: Maybe<Scalars["String"]["output"]>;
  /** Identifies a route. */
  routeId: Scalars["String"]["output"];
  /** Full name of a route. */
  routeLongName: Scalars["String"]["output"];
  /** Short name of a route. */
  routeShortName?: Maybe<Scalars["String"]["output"]>;
};

export type Search = {
  __typename?: "Search";
  routes: Array<Route>;
  stops: Array<Stop>;
};

export type Stop = {
  __typename?: "Stop";
  routes?: Maybe<Array<Route>>;
  /** Short text or a number that identifies the location for riders. */
  stopCode?: Maybe<Scalars["String"]["output"]>;
  /** Identifies a stop, station, or station entrance. */
  stopId: Scalars["String"]["output"];
  /** Stop Location. GeoJSON string. */
  stopLoc?: Maybe<Point>;
  /** Name of the location. Use a name that people will understand in the local and tourist vernacular. */
  stopName?: Maybe<Scalars["String"]["output"]>;
};

export type StopTimeEvent = {
  __typename?: "StopTimeEvent";
  delay?: Maybe<Scalars["Int"]["output"]>;
  time?: Maybe<Scalars["Int"]["output"]>;
  uncertainty?: Maybe<Scalars["Int"]["output"]>;
};

export type StopTimeUpdate = {
  __typename?: "StopTimeUpdate";
  /** If schedule_relationship is empty or SCHEDULED, either arrival or departure must be provided within a StopTimeUpdate - both fields cannot be empty. arrival and departure may both be empty when schedule_relationship is SKIPPED. If schedule_relationship is NO_DATA, arrival and departure must be empty. */
  arrival?: Maybe<StopTimeEvent>;
  /** If schedule_relationship is empty or SCHEDULED, either arrival or departure must be provided within a StopTimeUpdate - both fields cannot be empty. arrival and departure may both be empty when schedule_relationship is SKIPPED. If schedule_relationship is NO_DATA, arrival and departure must be empty. */
  departure?: Maybe<StopTimeEvent>;
  scheduleRelationship?: Maybe<Scalars["Int"]["output"]>;
  /** Must be the same as in stops.txt in the corresponding GTFS feed. */
  stopId?: Maybe<Scalars["String"]["output"]>;
  /** Must be the same as in stop_times.txt in the corresponding GTFS feed. */
  stopSequence?: Maybe<Scalars["Int"]["output"]>;
};

export type StopTimes = {
  __typename?: "StopTimes";
  arrivalTime: Scalars["String"]["output"];
  departureTime: Scalars["String"]["output"];
  dropOffType?: Maybe<Scalars["Int"]["output"]>;
  pickupType?: Maybe<Scalars["Int"]["output"]>;
  shapeDistTraveled?: Maybe<Scalars["Float"]["output"]>;
  stop: Stop;
  stopId: Scalars["String"]["output"];
  stopSequence: Scalars["Int"]["output"];
  timepoint?: Maybe<Scalars["Int"]["output"]>;
  tripId: Scalars["String"]["output"];
};

export type StopsAndShapes = {
  __typename?: "StopsAndShapes";
  shapes: Array<LineString>;
  stops: Array<Stop>;
};

export type Trip = {
  __typename?: "Trip";
  /** Indicates whether bikes are allowed. */
  bikesAllowed?: Maybe<Scalars["Int"]["output"]>;
  /** Identifies the block to which the trip belongs. */
  blockId?: Maybe<Scalars["String"]["output"]>;
  /** Indicates the direction of travel for a trip. */
  directionId?: Maybe<Scalars["Int"]["output"]>;
  route: Route;
  /** Identifies a route. */
  routeId: Scalars["String"]["output"];
  /** Identifies the scheduled trip ID from the transit agency. */
  scheduledTripId?: Maybe<Scalars["String"]["output"]>;
  /** Identifies a set of dates when service is available for one or more routes. */
  serviceId: Scalars["String"]["output"];
  /** Identifies a geospatial shape describing the vehicle travel path for a trip. */
  shapeId?: Maybe<Scalars["String"]["output"]>;
  /** Text that appears on signage identifying the trip's destination to riders. */
  tripHeadsign?: Maybe<Scalars["String"]["output"]>;
  /** Identifies a trip. */
  tripId: Scalars["String"]["output"];
  /** Public facing text used to identify the trip to riders, for instance, to identify train numbers for commuter rail trips. */
  tripShortName?: Maybe<Scalars["String"]["output"]>;
  /** Indicates wheelchair accessibility. */
  wheelchairAccessible?: Maybe<Scalars["Int"]["output"]>;
};

/** A descriptor that identifies a single instance of a GTFS trip. */
export type TripDescriptor = {
  __typename?: "TripDescriptor";
  /** The route_id from the GTFS feed that this selector refers to. If trip_id is omitted, then route_id, direction_id, start_time, and schedule_relationship=SCHEDULED must all be set to identify a trip instance. */
  routeId?: Maybe<Scalars["String"]["output"]>;
  /** The start date of this trip instance in YYYYMMDD format. */
  startDate?: Maybe<Scalars["String"]["output"]>;
  /** The initially scheduled start time of this trip instance. The field type Time defines the format of this field, for example 11:15:35 or 25:15:35. */
  startTime?: Maybe<Scalars["String"]["output"]>;
  /** The trip_id from the GTFS feed that this selector refers to. */
  tripId?: Maybe<Scalars["String"]["output"]>;
};

export type TripIdsForRoute = {
  __typename?: "TripIdsForRoute";
  tripIds: Array<Scalars["String"]["output"]>;
};

export type TripUpdate = {
  __typename?: "TripUpdate";
  delay?: Maybe<Scalars["Int"]["output"]>;
  stopTimeUpdate: Array<Maybe<StopTimeUpdate>>;
  timestamp: Scalars["Int"]["output"];
  trip: TripDescriptor;
  vehicle: VehicleDescriptor;
};

export type TripUpdatesFilter = {
  routeId?: InputMaybe<Scalars["String"]["input"]>;
  tripId?: InputMaybe<Scalars["String"]["input"]>;
};

export type VehicleDescriptor = {
  __typename?: "VehicleDescriptor";
  /** Internal system identification of the vehicle. Should be unique per vehicle, and is used for tracking the vehicle as it proceeds through the system. This id should not be made visible to the end-user; for that purpose use the label field */
  id?: Maybe<Scalars["String"]["output"]>;
  /** User visible label, i.e., something that must be shown to the passenger to help identify the correct vehicle. */
  label?: Maybe<Scalars["String"]["output"]>;
  /** The license plate of the vehicle. */
  licensePlate?: Maybe<Scalars["String"]["output"]>;
};

export type VehiclePosition = {
  __typename?: "VehiclePosition";
  congestionLevel?: Maybe<Scalars["Int"]["output"]>;
  /** The exact status of the vehicle with respect to the current stop. Ignored if current_stop_sequence is missing. */
  currentStatus?: Maybe<VehicleStopStatus>;
  /** The stop sequence index of the current stop. The meaning of current_stop_sequence (i.e., the stop that it refers to) is determined by current_status. If current_status is missing IN_TRANSIT_TO is assumed. */
  currentStopSequence?: Maybe<Scalars["Int"]["output"]>;
  /** Current position of this vehicle. */
  position?: Maybe<Position>;
  /** Identifies the current stop. The value must be the same as in stops.txt in the corresponding GTFS feed. */
  stopId?: Maybe<Scalars["String"]["output"]>;
  /** Moment at which the vehicle's position was measured. In POSIX time (i.e., number of seconds since January 1st 1970 00:00:00 UTC). */
  timestamp?: Maybe<Scalars["Int"]["output"]>;
  /** The Trip that this vehicle is serving. Can be empty or partial if the vehicle can not be identified with a given trip instance. */
  trip?: Maybe<TripDescriptor>;
  /** Additional information on the vehicle that is serving this trip. Each entry should have a unique vehicle id. */
  vehicle?: Maybe<VehicleDescriptor>;
};

export enum VehicleStopStatus {
  /** The vehicle is just about to arrive at the stop (on a stop display, the vehicle symbol typically flashes).  */
  IncomingAt = "INCOMING_AT",
  /** The vehicle has departed the previous stop and is in transit. */
  InTransitTo = "IN_TRANSIT_TO",
  /** The vehicle is standing at the stop. */
  StoppedAt = "STOPPED_AT",
}
