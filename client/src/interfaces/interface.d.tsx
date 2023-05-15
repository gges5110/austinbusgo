export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type ArrivalTime = {
  __typename?: "ArrivalTime";
  scheduledArrivalTime: Scalars["String"];
  trip: TripWithRoute;
  updatedArrivalTime?: Maybe<Scalars["String"]>;
  vehicle?: Maybe<VehiclePosition>;
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
  coordinates: Array<Array<Scalars["Float"]>>;
  type: GeometryType;
};

/** Point Scalar Description */
export type Point = {
  __typename?: "Point";
  coordinates: Array<Scalars["Float"]>;
  type: GeometryType;
};

export type Position = {
  __typename?: "Position";
  /** Bearing, in degrees, clockwise from True North, i.e., 0 is North and 90 is East. This can be the compass bearing, or the direction towards the next stop or intermediate location. This should not be deduced from the sequence of previous positions, which clients can compute from previous data. */
  bearing?: Maybe<Scalars["Float"]>;
  /** Degrees North, in the WGS-84 coordinate system. */
  latitude: Scalars["Float"];
  /** Degrees East, in the WGS-84 coordinate system. */
  longitude: Scalars["Float"];
  /** Momentary speed measured by the vehicle, in meters per second. */
  speed?: Maybe<Scalars["Float"]>;
};

export type Query = {
  __typename?: "Query";
  arrivalTimes?: Maybe<Array<ArrivalTime>>;
  distinctTrips?: Maybe<Array<Trip>>;
  nearByStops: Array<Stop>;
  realTimeVehiclePositions?: Maybe<Array<Maybe<VehiclePosition>>>;
  route: Route;
  routes?: Maybe<Array<Route>>;
  routeShapes: LineString;
  search: Search;
  stop: Stop;
  stopsAndShapes: StopsAndShapes;
  stopsByName?: Maybe<Array<Stop>>;
  stopTimes?: Maybe<Array<StopTimes>>;
  trip: TripWithRoute;
  tripIdsForRoute: TripIdsForRoute;
  vehiclePositions?: Maybe<Array<VehiclePosition>>;
};

export type QueryArrivalTimesArgs = {
  date: Scalars["String"];
  stopId: Scalars["String"];
};

export type QueryDistinctTripsArgs = {
  date: Scalars["String"];
  routeId: Scalars["String"];
};

export type QueryNearByStopsArgs = {
  lat: Scalars["Float"];
  lon: Scalars["Float"];
};

export type QueryRouteArgs = {
  routeId: Scalars["String"];
};

export type QueryRouteShapesArgs = {
  tripId: Scalars["String"];
};

export type QuerySearchArgs = {
  searchTerm: Scalars["String"];
};

export type QueryStopArgs = {
  stopId: Scalars["String"];
};

export type QueryStopsAndShapesArgs = {
  date: Scalars["String"];
  directionId: Scalars["Int"];
  routeId: Scalars["String"];
};

export type QueryStopsByNameArgs = {
  stopName: Scalars["String"];
};

export type QueryStopTimesArgs = {
  tripId: Scalars["String"];
};

export type QueryTripArgs = {
  tripId: Scalars["String"];
};

export type QueryTripIdsForRouteArgs = {
  date: Scalars["String"];
  routeId: Scalars["String"];
};

export type QueryVehiclePositionsArgs = {
  direction: Scalars["Int"];
  routeId: Scalars["String"];
};

export type Route = {
  __typename?: "Route";
  /** Agency for the specified route. */
  agencyId?: Maybe<Scalars["Int"]>;
  /** Route color designation that matches public facing material. */
  routeColor?: Maybe<Scalars["String"]>;
  /** Description of a route that provides useful, quality information. */
  routeDesc?: Maybe<Scalars["String"]>;
  /** Identifies a route. */
  routeId: Scalars["String"];
  /** Full name of a route. */
  routeLongName: Scalars["String"];
  /** Short name of a route. */
  routeShortName?: Maybe<Scalars["String"]>;
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
  stopCode?: Maybe<Scalars["String"]>;
  /** Identifies a stop, station, or station entrance. */
  stopId: Scalars["String"];
  /** Stop Location. GeoJSON string. */
  stopLoc?: Maybe<Point>;
  /** Name of the location. Use a name that people will understand in the local and tourist vernacular. */
  stopName?: Maybe<Scalars["String"]>;
};

export type StopsAndShapes = {
  __typename?: "StopsAndShapes";
  shapes: Array<LineString>;
  stops: Array<Stop>;
};

export type StopTimes = {
  __typename?: "StopTimes";
  arrivalTime: Scalars["String"];
  departureTime: Scalars["String"];
  dropOffType?: Maybe<Scalars["Int"]>;
  pickupType?: Maybe<Scalars["Int"]>;
  shapeDistTraveled?: Maybe<Scalars["Float"]>;
  stop: Stop;
  stopHeadsign?: Maybe<Scalars["String"]>;
  stopId: Scalars["String"];
  stopSequence: Scalars["Int"];
  supEstDelay?: Maybe<Scalars["String"]>;
  timepoint?: Maybe<Scalars["Int"]>;
  tripId: Scalars["String"];
};

export type Trip = {
  __typename?: "Trip";
  /** Indicates whether bikes are allowed. */
  bikesAllowed?: Maybe<Scalars["Int"]>;
  /** Identifies the block to which the trip belongs. */
  blockId?: Maybe<Scalars["String"]>;
  /** Indicates the direction of travel for a trip. */
  directionId?: Maybe<Scalars["Int"]>;
  /** Identifies a route. */
  routeId: Scalars["String"];
  /** Identifies a set of dates when service is available for one or more routes. */
  serviceId: Scalars["String"];
  /** Identifies a geospatial shape describing the vehicle travel path for a trip. */
  shapeId?: Maybe<Scalars["String"]>;
  /** Text that appears on signage identifying the trip's destination to riders. */
  tripHeadsign?: Maybe<Scalars["String"]>;
  /** Identifies a trip. */
  tripId: Scalars["String"];
  /** Public facing text used to identify the trip to riders, for instance, to identify train numbers for commuter rail trips. */
  tripShortName?: Maybe<Scalars["String"]>;
  /** Indicates wheelchair accessibility. */
  wheelchairAccessible?: Maybe<Scalars["Int"]>;
};

/** A descriptor that identifies a single instance of a GTFS trip. */
export type TripDescriptor = {
  __typename?: "TripDescriptor";
  /** The route_id from the GTFS feed that this selector refers to. If trip_id is omitted, then route_id, direction_id, start_time, and schedule_relationship=SCHEDULED must all be set to identify a trip instance. */
  routeId?: Maybe<Scalars["String"]>;
  /** The start date of this trip instance in YYYYMMDD format. */
  startDate?: Maybe<Scalars["String"]>;
  /** The initially scheduled start time of this trip instance. The field type Time defines the format of this field, for example 11:15:35 or 25:15:35. */
  startTime?: Maybe<Scalars["String"]>;
  /** The trip_id from the GTFS feed that this selector refers to. */
  tripId?: Maybe<Scalars["String"]>;
};

export type TripIdsForRoute = {
  __typename?: "TripIdsForRoute";
  tripIds: Array<Scalars["String"]>;
};

export type TripWithRoute = {
  __typename?: "TripWithRoute";
  /** Indicates whether bikes are allowed. */
  bikesAllowed?: Maybe<Scalars["Int"]>;
  /** Identifies the block to which the trip belongs. */
  blockId?: Maybe<Scalars["String"]>;
  /** Indicates the direction of travel for a trip. */
  directionId?: Maybe<Scalars["Int"]>;
  route: Route;
  /** Identifies a route. */
  routeId: Scalars["String"];
  /** Identifies a set of dates when service is available for one or more routes. */
  serviceId: Scalars["String"];
  /** Identifies a geospatial shape describing the vehicle travel path for a trip. */
  shapeId?: Maybe<Scalars["String"]>;
  /** Text that appears on signage identifying the trip's destination to riders. */
  tripHeadsign?: Maybe<Scalars["String"]>;
  /** Identifies a trip. */
  tripId: Scalars["String"];
  /** Public facing text used to identify the trip to riders, for instance, to identify train numbers for commuter rail trips. */
  tripShortName?: Maybe<Scalars["String"]>;
  /** Indicates wheelchair accessibility. */
  wheelchairAccessible?: Maybe<Scalars["Int"]>;
};

export type VehicleDescriptor = {
  __typename?: "VehicleDescriptor";
  /** Internal system identification of the vehicle. Should be unique per vehicle, and is used for tracking the vehicle as it proceeds through the system. This id should not be made visible to the end-user; for that purpose use the label field */
  id?: Maybe<Scalars["String"]>;
  /** User visible label, i.e., something that must be shown to the passenger to help identify the correct vehicle. */
  label?: Maybe<Scalars["String"]>;
  /** The license plate of the vehicle. */
  licensePlate?: Maybe<Scalars["String"]>;
};

export type VehiclePosition = {
  __typename?: "VehiclePosition";
  congestionLevel?: Maybe<Scalars["Int"]>;
  /** The exact status of the vehicle with respect to the current stop. Ignored if current_stop_sequence is missing. */
  currentStatus?: Maybe<VehicleStopStatus>;
  /** The stop sequence index of the current stop. The meaning of current_stop_sequence (i.e., the stop that it refers to) is determined by current_status. If current_status is missing IN_TRANSIT_TO is assumed. */
  currentStopSequence?: Maybe<Scalars["Int"]>;
  /** Current position of this vehicle. */
  position?: Maybe<Position>;
  /** Identifies the current stop. The value must be the same as in stops.txt in the corresponding GTFS feed. */
  stopId?: Maybe<Scalars["String"]>;
  /** Moment at which the vehicle's position was measured. In POSIX time (i.e., number of seconds since January 1st 1970 00:00:00 UTC). */
  timestamp?: Maybe<Scalars["Int"]>;
  /** The Trip that this vehicle is serving. Can be empty or partial if the vehicle can not be identified with a given trip instance. */
  trip?: Maybe<TripDescriptor>;
  /** Additional information on the vehicle that is serving this trip. Each entry should have a unique vehicle id. */
  vehicle?: Maybe<VehicleDescriptor>;
};

export enum VehicleStopStatus {
  /** The vehicle has departed the previous stop and is in transit. */
  InTransitTo = "IN_TRANSIT_TO",
  /** The vehicle is just about to arrive at the stop (on a stop display, the vehicle symbol typically flashes).  */
  IncomingAt = "INCOMING_AT",
  /** The vehicle is standing at the stop. */
  StoppedAt = "STOPPED_AT",
}
