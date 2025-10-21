"""Service for route-specific operations and data aggregation."""

from typing import List, Dict
from shapely import LineString

from services.gtfs_service import GTFSService
from services.gtfs_rt_service import GTFSRTService
from models.gtfs_models import Routes, Trips, Stops
from utils.logging import get_logger

logger = get_logger(__name__)


class RouteService:
    """Service for managing route-related queries and operations."""

    def __init__(self, gtfs_service: GTFSService, gtfs_rt_service: GTFSRTService):
        """
        Initialize RouteService.

        Args:
            gtfs_service: GTFS static data service
            gtfs_rt_service: GTFS real-time data service
        """
        self.gtfs_service = gtfs_service
        self.gtfs_rt_service = gtfs_rt_service

    def get_route(self, route_id: str) -> Routes:
        """
        Get route by ID.

        Args:
            route_id: Route identifier

        Returns:
            Route object
        """
        return self.gtfs_service.get_route(route_id)

    def get_all_routes(self) -> List[Routes]:
        """
        Get all routes.

        Returns:
            List of all routes
        """
        return self.gtfs_service.get_routes()

    def get_route_shapes(self, trip_id: str) -> LineString:
        """
        Get shapes for a specific trip.

        Args:
            trip_id: Trip identifier

        Returns:
            LineString geometry
        """
        return self.gtfs_service.get_shapes_by_trip_id(trip_id).shape

    def get_stops_and_shapes(
        self, route_id: str, direction_id: int, date: str
    ) -> Dict:
        """
        Get stops and shapes for a route in a specific direction.

        Args:
            route_id: Route identifier
            direction_id: Direction (0 or 1)
            date: Date string

        Returns:
            Dictionary with sorted stops and shapes
        """
        stops = self.gtfs_service.get_stops_by_route_id(route_id, direction_id)

        # Sort stops by sequence
        sorted_stops = sorted(
            [stop for stop in stops],
            key=lambda stop: stop.stop_time.stop_sequence
        )

        # Get unique shape IDs and fetch shapes
        shape_id_set = set([stop.stop_time.trip.shape_id for stop in stops])
        shapes = []
        for shape_id in shape_id_set:
            shapes.append(
                self.gtfs_service.get_shapes_by_shape_id(shape_id).shape
            )

        return {
            "stops": sorted_stops,
            "shapes": shapes
        }

    def get_trips_for_route(
        self, route_id: str, date: str, distinct: bool = False
    ) -> List[Trips]:
        """
        Get trips for a route on a specific date.

        Args:
            route_id: Route identifier
            date: Date string
            distinct: If True, return only distinct trips by short name

        Returns:
            List of trips
        """
        if distinct:
            return self.gtfs_service.get_trips_by_distinct_short_name(route_id, date)
        else:
            return self.gtfs_service.get_trips_for_date(route_id, date)

    def get_trip_ids_for_route(self, route_id: str, date: str) -> Dict[str, List[str]]:
        """
        Get all trip IDs for a route on a specific date.

        Args:
            route_id: Route identifier
            date: Date string

        Returns:
            Dictionary with 'tripIds' key containing list of trip IDs
        """
        trips = self.gtfs_service.get_trips_for_date(route_id, date)
        return {
            "tripIds": [trip.trip_id for trip in trips]
        }

    def get_vehicle_positions(
        self, route_id: str, direction: int
    ) -> List:
        """
        Get real-time vehicle positions for a route.

        Args:
            route_id: Route identifier
            direction: Direction (0 or 1)

        Returns:
            List of vehicle positions
        """
        return self.gtfs_rt_service.get_real_time_vehicle_positions_on_route(
            route_id, direction
        )
