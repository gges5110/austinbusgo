"""GraphQL dataloaders to prevent N+1 queries."""

from typing import List

from strawberry.dataloader import DataLoader
from sqlalchemy.ext.asyncio import AsyncSession

from server.services.gtfs_service import GTFSService


async def batch_load_routes_by_stop_id(
    stop_ids: List[str], gtfs_service: GTFSService
) -> List[List]:
    """Load routes for multiple stops in a single query."""
    routes_by_stop = await gtfs_service.get_routes_at_stops(stop_ids)

    # Return in the same order as input
    return [routes_by_stop[stop_id] for stop_id in stop_ids]


async def batch_load_route_by_id(
    route_ids: List[str], gtfs_service: GTFSService
) -> List:
    """Load routes by ID in a single query."""
    # Create a dict to hold routes by ID
    routes_by_id = {}

    # Get all routes (could be optimized with a get_routes_by_ids method)
    all_routes = await gtfs_service.get_routes()
    for route in all_routes:
        routes_by_id[route.route_id] = route

    # Return in the same order as input
    return [routes_by_id.get(route_id) for route_id in route_ids]


async def batch_load_stop_times_by_trip_id(
    trip_ids: List[str], gtfs_service: GTFSService
) -> List[List]:
    """Load stop times for multiple trips in a single batch."""
    # Create a dict to hold stop times for each trip
    stop_times_by_trip = {trip_id: [] for trip_id in trip_ids}

    # Get stop times for each trip
    for trip_id in trip_ids:
        stop_times = await gtfs_service.get_stop_times_by_trip_id(trip_id)
        stop_times_by_trip[trip_id] = stop_times

    # Return in the same order as input
    return [stop_times_by_trip[trip_id] for trip_id in trip_ids]


def create_dataloaders(gtfs_service: GTFSService):
    """Create all dataloaders with the given GTFS service."""
    return {
        "routes_by_stop": DataLoader(
            load_fn=lambda stop_ids: batch_load_routes_by_stop_id(
                stop_ids, gtfs_service
            )
        ),
        "route_by_id": DataLoader(
            load_fn=lambda route_ids: batch_load_route_by_id(route_ids, gtfs_service)
        ),
        "stop_times_by_trip": DataLoader(
            load_fn=lambda trip_ids: batch_load_stop_times_by_trip_id(
                trip_ids, gtfs_service
            )
        ),
    }
