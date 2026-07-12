from typing import List

from google.transit.gtfs_realtime_pb2 import TripUpdate, VehiclePosition
from sqlalchemy.exc import NoResultFound

from server.config import (
    capital_metro_trip_updates_pb_file_url,
    capital_metro_vehicle_positions_pb_file_url,
)
from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_service import GTFSService


class GTFSRTService:
    """
    Handles retrieving real-time GTFS data including vehicle positions and trip updates.
    """

    def __init__(
        self,
        gtfs_service: GTFSService,
        gtfs_rt_client: GTFSRTClient = None,
    ):
        self.gtfs_service = gtfs_service
        self.gtfs_rt_client = gtfs_rt_client or GTFSRTClient(
            capital_metro_trip_updates_pb_file_url,
            capital_metro_vehicle_positions_pb_file_url,
        )

    async def get_real_time_vehicle_positions_on_route(
        self, route_id: str, direction: int
    ) -> List[VehiclePosition]:
        current_vehicle_positions = self.gtfs_rt_client.load_vehicle_positions(
            route_id=route_id
        )
        trip_ids = [self.get_trip_id(vp) for vp in current_vehicle_positions]
        trips_on_route = await self.gtfs_service.get_trips_with_direction_and_route(
            trip_ids, route_id, direction
        )
        return [
            vp
            for vp in current_vehicle_positions
            if self.get_trip_id(vp) in trips_on_route
        ]

    def get_real_time_vehicle_positions(self) -> List[VehiclePosition]:
        return self.gtfs_rt_client.load_vehicle_positions()

    @staticmethod
    def get_trip_id(vehicle: VehiclePosition) -> str:
        return vehicle.trip.trip_id

    def get_all_real_time_trip_updates(
        self, route_id: str = None, trip_id: str = None
    ) -> List[TripUpdate]:
        trip_updates = self.gtfs_rt_client.load_trip_updates()
        if trip_id:
            return [tu for tu in trip_updates if tu.trip.trip_id == trip_id]
        elif route_id:
            return [tu for tu in trip_updates if tu.trip.route_id == route_id]
        else:
            return trip_updates

    def get_real_time_trip_updates(self, trip_ids: List[str]) -> List[TripUpdate]:
        trip_updates = self.gtfs_rt_client.load_trip_updates()
        return [tu for tu in trip_updates if tu.trip.trip_id in trip_ids]

    async def get_real_time_trip_updates_on_route(
        self, route_id: str, direction_id: int
    ) -> List[TripUpdate]:
        trip_updates = self.gtfs_rt_client.load_trip_updates()
        result = []
        for tu in trip_updates:
            if tu.trip.route_id != route_id:
                continue
            try:
                trip = await self.gtfs_service.get_trip_by_id(tu.trip.trip_id)
            except NoResultFound:
                # The live feed can reference trips missing from the loaded
                # static GTFS (e.g. during a data transition) — skip them
                # instead of failing the whole query.
                continue
            if trip.direction_id == direction_id:
                result.append(tu)
        return result

    @staticmethod
    def get_arrival_time_by_stop_id(
        stop_time_updates: List[TripUpdate.StopTimeUpdate], stop_id: str
    ):
        try:
            return next(stu for stu in stop_time_updates if stu.stop_id == stop_id)
        except StopIteration:
            return None
