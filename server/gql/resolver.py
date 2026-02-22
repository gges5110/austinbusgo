from datetime import datetime
from typing import List

from google.transit.gtfs_realtime_pb2 import TripUpdate, VehiclePosition
from pytz import timezone
from sqlalchemy.ext.asyncio import AsyncSession

from server.config import (
    capital_metro_trip_updates_pb_file_url,
    capital_metro_vehicle_positions_pb_file_url,
)
from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService


class Resolver:
    def __init__(self, session: AsyncSession, gtfs_service: GTFSService = None):
        self.gtfs_rt_client = GTFSRTClient(
            capital_metro_trip_updates_pb_file_url,
            capital_metro_vehicle_positions_pb_file_url,
        )
        self.gtfs_service = gtfs_service or GTFSService(session)
        self.gtfs_rt_service = GTFSRTService(self.gtfs_service, self.gtfs_rt_client)

    # Trips
    async def resolve_trip(self, query, info, trip_id: str):
        return await self.gtfs_service.get_trip_by_id(trip_id)

    async def resolve_distinct_trips(self, query, info, route_id: str, date: str):
        return await self.gtfs_service.get_trips_by_distinct_short_name(route_id, date)

    async def resolve_trip_ids_for_route(self, query, info, route_id: str, date: str):
        trips = await self.gtfs_service.get_trips_for_date(route_id, date)
        return {"tripIds": [t.trip_id for t in trips]}

    # Stops
    async def resolve_stops_and_shapes(
        self, query, info, route_id: str, direction_id: int, date: str
    ):
        stops = await self.gtfs_service.get_stops_by_route_id(route_id, direction_id)
        stops_sorted = sorted(stops, key=lambda s: s.stop_time.stop_sequence)
        shape_id_set = {s.stop_time.trip.shape_id for s in stops_sorted}
        shapes = []
        for shape_id in shape_id_set:
            agg = await self.gtfs_service.get_shapes_by_shape_id(shape_id)
            shapes.append(agg.shape)
        return {"stops": stops_sorted, "shapes": shapes}

    async def resolve_stop(self, query, info, stop_id: str):
        return await self.gtfs_service.get_stop(stop_id)

    async def resolve_near_by_stops(
        self,
        query,
        info,
        lat: float,
        lon: float,
        radius: float = 1000.0,
        limit: int = 20,
        min_lat: float = None,
        min_lon: float = None,
        max_lat: float = None,
        max_lon: float = None,
    ):
        return (
            await self.gtfs_service.get_near_by_stops(
                lat=lat,
                lon=lon,
                radius=radius,
                limit=limit,
                min_lat=min_lat,
                min_lon=min_lon,
                max_lat=max_lat,
                max_lon=max_lon,
            )
            or []
        )

    async def resolve_stops_by_name(self, query, info, stop_name: str):
        return await self.gtfs_service.get_stops_by_name(stop_name.split(" ")) or []

    # Routes
    async def resolve_route(self, query, info, route_id: str):
        return await self.gtfs_service.get_route(route_id)

    async def resolve_routes(self, query, info):
        return await self.gtfs_service.get_routes()

    async def resolve_route_shapes(self, query, info, trip_id: str):
        return await self.gtfs_service.get_shapes_by_trip_id(trip_id)

    async def resolve_vehicle_positions(
        self, query, info, route_id: str, direction: int
    ) -> List[VehiclePosition]:
        return await self.gtfs_rt_service.get_real_time_vehicle_positions_on_route(
            route_id, direction
        )

    async def resolve_stop_times(self, query, info, trip_id: str):
        return await self.gtfs_service.get_stop_times_by_trip_id(trip_id)

    async def resolve_search(self, query, info, search_term: str):
        search_terms = search_term.split(" ")
        return {
            "stops": await self.gtfs_service.get_stops_by_name(search_terms),
            "routes": await self.gtfs_service.get_routes_by_name(search_terms),
        }

    async def resolve_earliest_arrival_times_on_route(
        self, query, info, route_id: str, direction_id: int, date: str, time: str
    ):
        earliest = await self.gtfs_service.get_earliest_arrival_times_on_route(
            route_id, direction_id, date, time
        )
        trip_updates = await self.gtfs_rt_service.get_real_time_trip_updates_on_route(
            route_id, direction_id
        )
        stop_time_updates_list = [tu.stop_time_update for tu in trip_updates]
        return [
            {
                "scheduled_arrival_time": r.arrival_time,
                "stop_id": r.stop_id,
                "stop_sequence": r.stop_sequence,
                "trip_id": r.trip_id,
                "updated_arrival_time": self._get_earliest_updated_arrival_time(
                    r.stop_id, stop_time_updates_list
                ),
            }
            for r in earliest
        ]

    async def resolve_arrival_times(self, query, info, stop_id: str, date: str):
        stop_times = await self.gtfs_service.get_stop_times_by_stop_id(stop_id, date)
        trip_ids = [st.trip.trip_id for st in stop_times]
        trip_updates = self.gtfs_rt_service.get_real_time_trip_updates(trip_ids)
        trip_updates_by_trip_id = {
            tu.trip.trip_id: self._get_updated_arrival_time(
                stop_id, tu.stop_time_update
            )
            for tu in trip_updates
        }
        return [
            {
                "scheduled_arrival_time": st.arrival_time,
                "updated_arrival_time": trip_updates_by_trip_id.get(
                    st.trip.trip_id, None
                ),
                "trip": st.trip,
            }
            for st in stop_times
        ]

    def _get_updated_arrival_time(
        self, stop_id: str, stop_time_updates: List[TripUpdate.StopTimeUpdate]
    ):
        stop_time_update = self.gtfs_rt_service.get_arrival_time_by_stop_id(
            stop_time_updates, stop_id
        )
        if stop_time_update is None:
            return None
        if stop_time_update.schedule_relationship == 1:
            return None
        arrival_time_update = (
            stop_time_update.arrival.time
            if stop_time_update.HasField("arrival")
            else stop_time_update.departure.time
        )
        return (
            datetime.fromtimestamp(arrival_time_update)
            .astimezone(timezone("US/Central"))
            .strftime("%H:%M:%S")
        )

    def _get_earliest_updated_arrival_time(
        self,
        stop_id: str,
        stop_time_updates_list: List[List[TripUpdate.StopTimeUpdate]],
    ):
        earliest = None
        for stop_time_updates in stop_time_updates_list:
            t = self._get_updated_arrival_time(stop_id, stop_time_updates)
            if t:
                if earliest is None or t < earliest:
                    earliest = t
        return earliest

    async def resolve_feed_info(self, query, info):
        return await self.gtfs_service.get_feed_info()

    def resolve_vehicle_positions_debug(self, query, info) -> List[VehiclePosition]:
        return self.gtfs_rt_service.get_real_time_vehicle_positions()

    def resolve_trip_update(self, query, info, trip_id: str):
        trip_updates = self.gtfs_rt_service.get_all_real_time_trip_updates(
            trip_id=trip_id
        )
        return trip_updates[0] if trip_updates else None

    def resolve_trip_updates(self, query, info, filter) -> List[TripUpdate]:
        return self.gtfs_rt_service.get_all_real_time_trip_updates(
            filter.route_id if filter else None,
            filter.trip_id if filter else None,
        )
