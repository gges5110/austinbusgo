import graphene

from gql.geometry_types import Point
from services.gtfs_service import GTFSService


class Route(graphene.ObjectType):
    route_id = graphene.String(description="Identifies a route.", required=True)
    agency_id = graphene.Int(description="Agency for the specified route.")
    route_short_name = graphene.String(description="Short name of a route.")
    route_long_name = graphene.String(
        description="Full name of a route.", required=True
    )
    route_color = graphene.String(
        description="Route color designation that matches public facing material."
    )
    route_desc = graphene.String(
        description="Description of a route that provides useful, quality information."
    )


class Stop(graphene.ObjectType):
    stop_id = graphene.String(
        description="Identifies a stop, station, or station entrance.", required=True
    )
    stop_code = graphene.String(
        description="Short text or a number that identifies the location for riders."
    )
    stop_name = graphene.String(
        description="Name of the location. Use a name that people will understand in the "
        "local and tourist vernacular."
    )
    stop_loc = graphene.Field(Point, description="Stop Location. GeoJSON string.")

    routes = graphene.List(graphene.NonNull(Route))

    def resolve_routes(self, info, **kwargs):
        return GTFSService.get_routes_at_stop(self.stop_id)


class Trip(graphene.ObjectType):
    route_id = graphene.String(description="Identifies a route.", required=True)
    service_id = graphene.String(
        description="Identifies a set of dates when service is available for one or more "
        "routes.",
        required=True,
    )
    trip_id = graphene.String(description="Identifies a trip.", required=True)
    trip_headsign = graphene.String(
        description="Text that appears on signage identifying the trip's destination to "
        "riders."
    )
    trip_short_name = graphene.String(
        description="Public facing text used to identify the trip to riders, "
        "for instance, to identify train numbers for commuter rail trips."
    )
    direction_id = graphene.Int(
        description="Indicates the direction of travel for a trip."
    )
    block_id = graphene.String(
        description="Identifies the block to which the trip belongs."
    )
    shape_id = graphene.String(
        description="Identifies a geospatial shape describing the vehicle travel path for a "
        "trip."
    )
    wheelchair_accessible = graphene.Int(
        description="Indicates wheelchair accessibility."
    )
    bikes_allowed = graphene.Int(description="Indicates whether bikes are allowed.")


class StopTimes(graphene.ObjectType):
    trip_id = graphene.String(required=True)
    arrival_time = graphene.String(required=True)
    departure_time = graphene.String(required=True)
    stop_id = graphene.String(required=True)
    stop_sequence = graphene.Int(required=True)
    stop_headsign = graphene.String()
    pickup_type = graphene.Int()
    drop_off_type = graphene.Int()
    shape_dist_traveled = graphene.Float()
    timepoint = graphene.Int()
    sup_est_delay = graphene.String()
    stop = graphene.Field(graphene.NonNull(Stop))
