/**
 * Shared domain types.
 *
 * These re-export the orval-generated API models so the whole app shares
 * one type world with the API layer. This module keeps its historical path
 * (it predates the REST migration as a generated GraphQL schema file) so
 * its ~70 consumers didn't need touching.
 */
export type {
  LineString,
  Point,
  Position,
  Route,
  Stop,
  StopTimeEvent,
  StopTimeUpdate,
  Trip,
  TripDescriptor,
  TripUpdate,
  VehicleDescriptor,
  VehiclePosition,
} from "shared/api/generated/model";
export type { StopTime as StopTimes } from "shared/api/generated/model";

export enum GeometryType {
  Point = "Point",
  LineString = "LineString",
  MultiPoint = "MultiPoint",
  MultiLineString = "MultiLineString",
  Polygon = "Polygon",
  MultiPolygon = "MultiPolygon",
  GeometryCollection = "GeometryCollection",
}

// GTFS-RT VehicleStopStatus values as served by /api/rt/vehicle-positions
export enum VehicleStopStatus {
  /** The vehicle is just about to arrive at the stop (on a stop display, the vehicle symbol typically flashes).  */
  IncomingAt = "INCOMING_AT",
  /** The vehicle has departed the previous stop and is in transit. */
  InTransitTo = "IN_TRANSIT_TO",
  /** The vehicle is standing at the stop. */
  StoppedAt = "STOPPED_AT",
}
