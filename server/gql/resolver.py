"""GraphQL resolver implementation using service layer."""

from typing import List
from google.transit.gtfs_realtime_pb2 import VehiclePosition, TripUpdate
from shapely import LineString

from server.config import CAPITAL_METRO
from server.models.gtfs_models import Stops, Trips, Routes, FeedInfo
from server.services import (
    GTFSService,
    GTFSRTClient,
    GTFSRTService,
    ArrivalsService,
    SearchService,
    RouteService
)
from server.utils.logging import get_logger

logger = get_logger(__name__)


class Resolver:
    """GraphQL resolver that delegates to service layer."""

    def __init__(self, gtfs_service: GTFSService = None):
        """
        Initialize resolver with services.

        Args:
            gtfs_service: Optional GTFS service instance
        """
        # Initialize base services
        self.gtfs_service = gtfs_service or GTFSService()
        self.gtfs_rt_client = GTFSRTClient(
            CAPITAL_METRO.trip_updates_url,
            CAPITAL_METRO.vehicle_positions_url,
        )
        self.gtfs_rt_service = GTFSRTService(self.gtfs_rt_client)

        # Initialize domain services
        self.arrivals_service = ArrivalsService(
            self.gtfs_service, self.gtfs_rt_service
        )
        self.search_service = SearchService(self.gtfs_service)
        self.route_service = RouteService(self.gtfs_service, self.gtfs_rt_service)

    # Trip resolvers
    def resolve_trip(self, query, info, trip_id: str) -> Trips:
        """Get trip by ID."""
        return self.gtfs_service.get_trip_by_id(trip_id)

    def resolve_distinct_trips(
        self, query, info, route_id: str, date: str
    ) -> List[Trips]:
        """Get distinct trips for route."""
        return self.route_service.get_trips_for_route(
            route_id, date, distinct=True
        )

    def resolve_trip_ids_for_route(self, query, info, route_id: str, date: str):
        """Get all trip IDs for route."""
        return self.route_service.get_trip_ids_for_route(route_id, date)

    # Stop resolvers
    def resolve_stops_and_shapes(
        self, query, info, route_id: str, direction_id: int, date: str
    ):
        """Get stops and shapes for route."""
        return self.route_service.get_stops_and_shapes(
            route_id, direction_id, date
        )

    def resolve_stop(self, query, info, stop_id: str) -> Stops:
        """Get stop by ID."""
        return self.gtfs_service.get_stop(stop_id)

    def resolve_near_by_stops(
        self, query, info, lat: float, lon: float, distance: float = 0.01
    ) -> List[Stops]:
        """Get stops near coordinates."""
        return self.search_service.search_nearby_stops(lat, lon, distance)

    def resolve_stops_by_name(self, query, info, stop_name) -> List[Stops]:
        """Search stops by name."""
        return self.search_service.search_stops_by_name(stop_name)

    # Route resolvers
    def resolve_route(self, query, info, route_id) -> Routes:
        """Get route by ID."""
        return self.route_service.get_route(route_id)

    def resolve_routes(self, query, info) -> List[Routes]:
        """Get all routes."""
        return self.route_service.get_all_routes()

    def resolve_route_shapes(self, query, info, trip_id) -> LineString:
        """Get shapes for trip."""
        return self.route_service.get_route_shapes(trip_id)

    def resolve_vehicle_positions(
        self, query, info, route_id: str, direction: int
    ) -> List[VehiclePosition]:
        """Get real-time vehicle positions."""
        return self.route_service.get_vehicle_positions(route_id, direction)

    def resolve_stop_times(self, query, info, trip_id: str):
        """Get stop times for trip."""
        return self.gtfs_service.get_stop_times_by_trip_id(trip_id)

    # Search resolver
    def resolve_search(self, query, info, search_term: str):
        """Search for stops and routes."""
        return self.search_service.search(search_term)

    # Arrival time resolvers
    def resolve_earliest_arrival_times_on_route(
        self, query, info, route_id: str, direction_id: int, date: str, time: str
    ):
        """Get earliest arrival times on route with real-time updates."""
        return self.arrivals_service.get_earliest_arrival_times_on_route(
            route_id, direction_id, date, time
        )

    def resolve_arrival_times(self, query, info, stop_id: str, date: str):
        """Get arrival times for stop with real-time updates."""
        return self.arrivals_service.get_arrival_times_for_stop(stop_id, date)

    # Feed info resolver
    def resolve_feed_info(self, query, info) -> FeedInfo:
        """Get GTFS feed information."""
        return self.gtfs_service.get_feed_info()

    # Debug and utility resolvers
    def resolve_vehicle_positions_debug(self, query, info) -> List[VehiclePosition]:
        """Get all vehicle positions (debug)."""
        return self.gtfs_rt_service.get_real_time_vehicle_positions()

    def resolve_trip_update(self, query, info, trip_id: str) -> TripUpdate:
        """Get trip update by trip ID."""
        trip_updates = self.gtfs_rt_service.get_all_real_time_trip_updates(
            trip_id=trip_id
        )
        return trip_updates[0] if len(trip_updates) > 0 else None

    def resolve_trip_updates(self, query, info, filter) -> List[TripUpdate]:
        """Get trip updates with filter."""
        return self.gtfs_rt_service.get_all_real_time_trip_updates(
            filter.route_id, filter.trip_id
        )
