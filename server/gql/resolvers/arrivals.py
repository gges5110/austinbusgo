"""Arrival time resolver methods."""

from typing import List

from server.gql.resolvers.base import BaseResolver
from server.gql.types.response_types import ArrivalTime, ArrivalTimeAtStop


class ArrivalsResolver(BaseResolver):
    """Resolver for arrival time queries."""

    async def resolve_arrival_times(self, stop_id: str, date: str) -> List[ArrivalTime]:
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
            ArrivalTime(
                scheduled_arrival_time=st.arrival_time,
                updated_arrival_time=trip_updates_by_trip_id.get(st.trip.trip_id, None),
                trip=st.trip,
            )
            for st in stop_times
        ]

    async def resolve_earliest_arrival_times_on_route(
        self, route_id: str, direction_id: int, date: str, time: str
    ) -> List[ArrivalTimeAtStop]:
        earliest = await self.gtfs_service.get_earliest_arrival_times_on_route(
            route_id, direction_id, date, time
        )
        trip_updates = await self.gtfs_rt_service.get_real_time_trip_updates_on_route(
            route_id, direction_id
        )
        stop_time_updates_list = [tu.stop_time_update for tu in trip_updates]
        return [
            ArrivalTimeAtStop(
                stop_id=r.stop_id,
                stop_sequence=r.stop_sequence,
                scheduled_arrival_time=r.arrival_time,
                trip_id=r.trip_id,
                updated_arrival_time=self._get_earliest_updated_arrival_time(
                    r.stop_id, stop_time_updates_list
                ),
            )
            for r in earliest
        ]
