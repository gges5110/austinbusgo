"""This file contains methods to retrieve data from database"""

import math
from datetime import date, datetime, timedelta
from types import SimpleNamespace
from typing import List, Optional

from sqlalchemy import Integer, case, cast, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from server.models.gtfs_models import (
    AggregatedShape,
    CalendarDates,
    FeedInfo,
    Routes,
    RoutesAtStop,
    Stops,
    StopTimes,
    Trips,
)

# Minimum word_similarity for a search hit (see services/text_similarity). Low enough to absorb
# typos ("guadelupe" ~ "Guadalupe" scores well above this); ranking and the
# result limit keep noise out of the top results.
SEARCH_SIMILARITY_THRESHOLD = 0.3


class GTFSService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # Routes
    async def get_route(self, route_id: str) -> Routes:
        result = await self.session.execute(
            select(Routes).where(Routes.route_id == route_id)
        )
        return result.scalar_one()

    async def get_routes(self) -> List[Routes]:
        result = await self.session.execute(
            select(Routes).order_by(cast(Routes.route_id, Integer))
        )
        return result.scalars().all()

    async def get_routes_by_name(
        self, search_term: str, limit: Optional[int] = None
    ) -> List[Routes]:
        """Typo-tolerant route search using trigram word similarity.

        The whole search term is matched as a phrase (not OR-ed words), an
        exact route id sorts first, and everything else ranks by similarity.
        """
        score = func.max(
            func.word_similarity(search_term, Routes.route_long_name),
            func.word_similarity(search_term, Routes.route_id),
        )
        exact_id_first = case((Routes.route_id == search_term, 0), else_=1)
        query = (
            select(Routes)
            .where(
                or_(
                    score >= SEARCH_SIMILARITY_THRESHOLD,
                    Routes.route_id.startswith(search_term, autoescape=True),
                )
            )
            .order_by(exact_id_first, score.desc(), cast(Routes.route_id, Integer))
        )
        if limit is not None:
            query = query.limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_routes_at_stop(self, stop_id: str) -> List[Routes]:
        result = await self.session.execute(
            select(Routes)
            .join(RoutesAtStop, RoutesAtStop.route_id == Routes.route_id)
            .where(RoutesAtStop.stop_id == stop_id)
        )
        return result.scalars().all()

    async def get_routes_at_stops(self, stop_ids: List[str]) -> dict:
        """Routes for many stops in one query, keyed by stop_id."""
        result = await self.session.execute(
            select(RoutesAtStop.stop_id, Routes)
            .join(Routes, RoutesAtStop.route_id == Routes.route_id)
            .where(RoutesAtStop.stop_id.in_(stop_ids))
        )
        routes_by_stop: dict = {stop_id: [] for stop_id in stop_ids}
        for stop_id, route in result.all():
            routes_by_stop[stop_id].append(route)
        return routes_by_stop

    # Stops
    async def get_stop(self, stop_id: str) -> Stops:
        result = await self.session.execute(
            select(
                Stops.stop_id,
                Stops.stop_code,
                Stops.stop_name,
                Stops.stop_desc,
                Stops.stop_loc,
                Stops.zone_id,
                Stops.stop_url,
                Stops.location_type,
                Stops.parent_station,
                Stops.stop_timezone,
                Stops.wheelchair_boarding,
                Stops.corner_placement,
                Stops.stop_position,
                Stops.on_street,
                Stops.at_street,
                Stops.heading,
            ).where(Stops.stop_id == stop_id)
        )
        row = result.one()
        return SimpleNamespace(**row._mapping)

    async def get_stops(self) -> List[SimpleNamespace]:
        result = await self.session.execute(
            select(
                Stops.stop_id,
                Stops.stop_code,
                Stops.stop_name,
                Stops.stop_loc,
            )
        )
        return [SimpleNamespace(**row._mapping) for row in result]

    async def get_stops_by_name(
        self, search_term: str, limit: Optional[int] = None
    ) -> List[Stops]:
        """Typo-tolerant stop search using trigram word similarity.

        Matches the whole term against stop/street names, plus a prefix
        match on the rider-facing stop code. An exact stop code sorts
        first, then results rank by best similarity across the columns.
        """
        score = func.max(
            func.word_similarity(search_term, Stops.stop_name),
            func.word_similarity(search_term, func.coalesce(Stops.on_street, "")),
            func.word_similarity(search_term, func.coalesce(Stops.at_street, "")),
        )
        exact_code_first = case((Stops.stop_code == search_term, 0), else_=1)
        query = (
            select(
                Stops.stop_id,
                Stops.stop_code,
                Stops.stop_name,
                Stops.stop_loc,
            )
            .where(
                or_(
                    score >= SEARCH_SIMILARITY_THRESHOLD,
                    Stops.stop_code.startswith(search_term, autoescape=True),
                )
            )
            .order_by(exact_code_first, score.desc(), Stops.stop_name)
        )
        if limit is not None:
            query = query.limit(limit)
        result = await self.session.execute(query)
        return [SimpleNamespace(**row._mapping) for row in result]

    async def get_all_routes_at_stops(self) -> dict:
        """Load all routes per stop into memory. Returns {stop_id: [route, ...]}."""
        result = await self.session.execute(
            select(
                RoutesAtStop.stop_id,
                Routes.route_id,
                Routes.agency_id,
                Routes.route_short_name,
                Routes.route_long_name,
                Routes.route_color,
            ).join(Routes, Routes.route_id == RoutesAtStop.route_id)
        )
        cache: dict = {}
        for row in result:
            route = SimpleNamespace(
                route_id=row.route_id,
                agency_id=row.agency_id,
                route_short_name=row.route_short_name,
                route_long_name=row.route_long_name,
                route_color=row.route_color,
            )
            cache.setdefault(row.stop_id, []).append(route)
        return cache

    async def get_near_by_stops(
        self,
        min_lat: float,
        min_lon: float,
        max_lat: float,
        max_lon: float,
        limit: int = 20,
        route_counts: Optional[dict] = None,
    ) -> List[SimpleNamespace]:
        """Stops inside the bounding box, best first.

        Ranks by (route count + 1) / (meters from the box center * 10 + 1),
        favoring well-served stops near the center. `route_counts`
        ({stop_id: count}) normally comes from the startup cache; without
        it the counts are queried.
        """
        result = await self.session.execute(
            select(
                Stops.stop_id,
                Stops.stop_code,
                Stops.stop_name,
                Stops.stop_loc,
                Stops.stop_lat,
                Stops.stop_lon,
            ).where(
                Stops.stop_lat.between(min_lat, max_lat),
                Stops.stop_lon.between(min_lon, max_lon),
            )
        )
        rows = result.all()
        if route_counts is None:
            route_counts = await self._get_route_counts([row.stop_id for row in rows])

        center_lat = (min_lat + max_lat) / 2
        center_lon = (min_lon + max_lon) / 2
        scored = []
        for row in rows:
            count = route_counts.get(row.stop_id, 0)
            distance = _distance_meters(
                row.stop_lat, row.stop_lon, center_lat, center_lon
            )
            score = (count + 1.0) / (distance * 10.0 + 1.0)
            scored.append(
                (
                    score,
                    SimpleNamespace(
                        stop_id=row.stop_id,
                        stop_code=row.stop_code,
                        stop_name=row.stop_name,
                        stop_loc=row.stop_loc,
                        route_count=count,
                    ),
                )
            )
        scored.sort(key=lambda x: x[0], reverse=True)
        return [s for _, s in scored[:limit]]

    async def _get_route_counts(self, stop_ids: List[str]) -> dict:
        result = await self.session.execute(
            select(RoutesAtStop.stop_id, func.count(RoutesAtStop.route_id))
            .where(RoutesAtStop.stop_id.in_(stop_ids))
            .group_by(RoutesAtStop.stop_id)
        )
        return {stop_id: count for stop_id, count in result.all()}

    async def get_stops_by_route_id(
        self, route_id: str, direction_id: int
    ) -> List[SimpleNamespace]:
        """Stops served by the route in one direction.

        Each stop carries its lowest stop_sequence (for ordering) and the
        shape most of its trips use. Taking the most common shape per stop
        covers branches with as few distinct shapes as possible; feeds
        often publish many near-identical per-trip shapes.
        """
        sql = text("""
            SELECT
                stops.stop_id, stops.stop_code, stops.stop_name,
                stops.stop_loc, trips.shape_id,
                MIN(stop_times.stop_sequence) AS stop_sequence,
                COUNT(*) AS trip_count
            FROM stops
            JOIN stop_times ON stops.stop_id = stop_times.stop_id
            JOIN trips ON stop_times.trip_id = trips.trip_id
            WHERE trips.route_id = :route_id
              AND trips.direction_id = :direction_id
            GROUP BY stops.stop_id, trips.shape_id
            ORDER BY stops.stop_id, trips.shape_id
            """)
        result = await self.session.execute(
            sql, {"route_id": route_id, "direction_id": direction_id}
        )
        stops: dict = {}
        for row in result:
            stop = stops.get(row.stop_id)
            if stop is None:
                stops[row.stop_id] = SimpleNamespace(
                    stop_id=row.stop_id,
                    stop_code=row.stop_code,
                    stop_name=row.stop_name,
                    stop_loc=row.stop_loc,
                    stop_time=SimpleNamespace(
                        stop_sequence=row.stop_sequence,
                        trip=SimpleNamespace(shape_id=row.shape_id),
                    ),
                    trip_count=row.trip_count,
                )
                continue
            stop.stop_time.stop_sequence = min(
                stop.stop_time.stop_sequence, row.stop_sequence
            )
            # Rows are ordered by shape_id, so ties keep the lowest shape_id
            if row.trip_count > stop.trip_count:
                stop.stop_time.trip.shape_id = row.shape_id
                stop.trip_count = row.trip_count
        return list(stops.values())

    # Trips
    async def get_trips_by_distinct_short_name(
        self, route_id: str, date: str
    ) -> List[Trips]:
        parsed_date = datetime.strptime(date, "%Y%m%d").date()
        sql = text("""
            -- One trip per direction (the lowest trip_id): SQLite reads bare
            -- columns from the row that produced the MIN().
            SELECT
                MIN(trips.trip_id) AS trip_id, trips.route_id, trips.service_id,
                trips.trip_headsign, trips.direction_id, trips.block_id,
                trips.shape_id, trips.scheduled_trip_id, trips.trip_short_name,
                trips.wheelchair_accessible, trips.bikes_allowed
            FROM trips
            JOIN calendar_dates ON calendar_dates.service_id = trips.service_id
            WHERE trips.route_id = :route_id
              AND calendar_dates.date = :date
            GROUP BY trips.direction_id
            ORDER BY trips.direction_id
            """)
        result = await self.session.execute(
            sql, {"route_id": route_id, "date": parsed_date.isoformat()}
        )
        return [SimpleNamespace(**row._mapping) for row in result]

    async def get_trips_for_date(self, route_id: str, date: str) -> List[Trips]:
        parsed_date = datetime.strptime(date, "%Y%m%d").date()
        result = await self.session.execute(
            select(Trips)
            .join(CalendarDates, CalendarDates.service_id == Trips.service_id)
            .where((CalendarDates.date == parsed_date) & (Trips.route_id == route_id))
        )
        return result.scalars().all()

    async def get_trips_with_direction_and_route(
        self, trip_ids: List[str], route_id: str, direction: int
    ) -> List[str]:
        result = await self.session.execute(
            select(Trips.trip_id).where(
                Trips.trip_id.in_(trip_ids)
                & (Trips.route_id == route_id)
                & (Trips.direction_id == direction)
            )
        )
        return [row[0] for row in result]

    async def get_trip_by_id(self, trip_id: str) -> SimpleNamespace:
        sql = text("""
            SELECT trips.trip_id, trips.route_id, trips.service_id,
                   trips.trip_headsign, trips.direction_id, trips.block_id,
                   trips.shape_id, trips.scheduled_trip_id, trips.trip_short_name,
                   trips.wheelchair_accessible, trips.bikes_allowed,
                   routes.route_id AS r_route_id,
                   routes.route_short_name, routes.route_long_name,
                   routes.agency_id, routes.route_color
            FROM trips
            JOIN routes ON routes.route_id = trips.route_id
            WHERE trips.trip_id = :trip_id
            LIMIT 1
            """)
        result = await self.session.execute(sql, {"trip_id": trip_id})
        row = result.one()
        route = SimpleNamespace(
            route_id=row.r_route_id,
            route_short_name=row.route_short_name,
            route_long_name=row.route_long_name,
            agency_id=row.agency_id,
            route_color=row.route_color,
        )
        trip = SimpleNamespace(
            trip_id=row.trip_id,
            route_id=row.route_id,
            service_id=row.service_id,
            trip_headsign=row.trip_headsign,
            direction_id=row.direction_id,
            block_id=row.block_id,
            shape_id=row.shape_id,
            scheduled_trip_id=row.scheduled_trip_id,
            trip_short_name=row.trip_short_name,
            wheelchair_accessible=row.wheelchair_accessible,
            bikes_allowed=row.bikes_allowed,
            route=route,
        )
        return trip

    # Shapes
    async def get_shapes_by_trip_id(self, trip_id: str) -> SimpleNamespace:
        result = await self.session.execute(
            select(Trips.shape_id).where(Trips.trip_id == trip_id)
        )
        shape_id = result.scalar_one()
        return await self.get_shapes_by_shape_id(shape_id)

    async def get_shapes_by_shape_id(self, shape_id: str) -> SimpleNamespace:
        result = await self.session.execute(
            select(
                AggregatedShape.shape_id,
                AggregatedShape.shape,
            ).where(AggregatedShape.shape_id == shape_id)
        )
        row = result.one()
        return SimpleNamespace(shape_id=row.shape_id, shape=row.shape)

    # StopTimes
    async def get_stop_times_by_trip_id(self, trip_id: str) -> List[SimpleNamespace]:
        sql = text("""
            SELECT st.trip_id, st.arrival_time, st.departure_time,
                   st.stop_id, st.stop_sequence, st.pickup_type,
                   st.drop_off_type, st.shape_dist_traveled, st.timepoint,
                   stops.stop_id AS s_stop_id,
                   stops.stop_code, stops.stop_name,
                   stops.stop_loc
            FROM stop_times st
            JOIN stops ON stops.stop_id = st.stop_id
            WHERE st.trip_id = :trip_id
            ORDER BY st.stop_sequence
            """)
        result = await self.session.execute(sql, {"trip_id": trip_id})
        stop_times = []
        for row in result:
            stop = SimpleNamespace(
                stop_id=row.s_stop_id,
                stop_code=row.stop_code,
                stop_name=row.stop_name,
                stop_loc=row.stop_loc,
            )
            st = SimpleNamespace(
                trip_id=row.trip_id,
                arrival_time=row.arrival_time,
                departure_time=row.departure_time,
                stop_id=row.stop_id,
                stop_sequence=row.stop_sequence,
                pickup_type=row.pickup_type,
                drop_off_type=row.drop_off_type,
                shape_dist_traveled=row.shape_dist_traveled,
                timepoint=row.timepoint,
                stop=stop,
            )
            stop_times.append(st)
        return stop_times

    async def get_stop_times_by_stop_id(
        self, stop_id: str, date: str
    ) -> List[SimpleNamespace]:
        parsed_date = datetime.strptime(date, "%Y%m%d").date()
        cutoff = (datetime.now() + timedelta(minutes=-10)).strftime("%H:%M:%S")
        sql = text("""
            SELECT st.trip_id, st.arrival_time, st.departure_time,
                   st.stop_id, st.stop_sequence,
                   trips.trip_id AS t_trip_id, trips.route_id,
                   trips.trip_headsign, trips.direction_id,
                   trips.shape_id, trips.service_id,
                   trips.scheduled_trip_id, trips.trip_short_name,
                   trips.wheelchair_accessible, trips.bikes_allowed,
                   trips.block_id,
                   routes.route_id AS r_route_id,
                   routes.route_short_name, routes.route_long_name,
                   routes.agency_id, routes.route_color
            FROM stop_times st
            JOIN trips ON st.trip_id = trips.trip_id
            JOIN routes ON routes.route_id = trips.route_id
            JOIN calendar_dates ON calendar_dates.service_id = trips.service_id
            WHERE st.stop_id = :stop_id
              AND calendar_dates.date = :date
              AND st.arrival_time > :cutoff
            ORDER BY st.arrival_time
            """)
        result = await self.session.execute(
            sql, {"stop_id": stop_id, "date": parsed_date.isoformat(), "cutoff": cutoff}
        )
        stop_times = []
        for row in result:
            route = SimpleNamespace(
                route_id=row.r_route_id,
                route_short_name=row.route_short_name,
                route_long_name=row.route_long_name,
                agency_id=row.agency_id,
                route_color=row.route_color,
            )
            trip = SimpleNamespace(
                trip_id=row.t_trip_id,
                route_id=row.route_id,
                service_id=row.service_id,
                trip_headsign=row.trip_headsign,
                direction_id=row.direction_id,
                block_id=row.block_id,
                shape_id=row.shape_id,
                scheduled_trip_id=row.scheduled_trip_id,
                trip_short_name=row.trip_short_name,
                wheelchair_accessible=row.wheelchair_accessible,
                bikes_allowed=row.bikes_allowed,
                route=route,
            )
            st = SimpleNamespace(
                trip_id=row.trip_id,
                arrival_time=row.arrival_time,
                departure_time=row.departure_time,
                stop_id=row.stop_id,
                stop_sequence=row.stop_sequence,
                trip=trip,
            )
            stop_times.append(st)
        return stop_times

    async def get_stop_times_at_stop_in_window(
        self,
        stop_id: str,
        service_date: date,
        start_time: str,
        end_time: str,
        limit: Optional[int] = None,
    ) -> List[SimpleNamespace]:
        """Scheduled stops at `stop_id` on one service day, in a time window.

        Times are GTFS "HH:MM:SS" strings relative to the service day; they
        can exceed 24:00:00 for trips running past midnight. Zero-padded
        hours compare correctly as text, so the window is a string range.
        """
        sql = text(f"""
            SELECT st.trip_id, st.arrival_time, st.departure_time,
                   st.stop_sequence,
                   trips.route_id, trips.trip_headsign, trips.direction_id,
                   routes.route_color
            FROM stop_times st
            JOIN trips ON st.trip_id = trips.trip_id
            JOIN routes ON routes.route_id = trips.route_id
            JOIN calendar_dates ON calendar_dates.service_id = trips.service_id
            WHERE st.stop_id = :stop_id
              AND calendar_dates.date = :date
              AND st.arrival_time >= :start_time
              AND st.arrival_time <= :end_time
            ORDER BY st.arrival_time
            {"LIMIT :limit" if limit is not None else ""}
            """)
        params = {
            "stop_id": stop_id,
            "date": service_date.isoformat(),
            "start_time": start_time,
            "end_time": end_time,
        }
        if limit is not None:
            params["limit"] = limit
        result = await self.session.execute(sql, params)
        return [SimpleNamespace(**row._mapping) for row in result]

    async def get_earliest_arrival_times_on_route(
        self, route_id: str, direction_id: int, date: str, time: str
    ) -> List[SimpleNamespace]:
        parsed_date = datetime.strptime(date, "%Y%m%d").date()
        sql = text("""
            SELECT st.arrival_time, st.stop_id, st.stop_sequence, st.trip_id
            FROM stop_times st
            JOIN (
                SELECT st2.stop_id, st2.stop_sequence, MIN(st2.arrival_time) AS min_arrival
                FROM stop_times st2
                JOIN trips t2 ON t2.trip_id = st2.trip_id
                JOIN routes r2 ON r2.route_id = t2.route_id
                JOIN calendar_dates cd2 ON cd2.service_id = t2.service_id
                WHERE st2.arrival_time >= :time
                  AND cd2.date = :date
                  AND r2.route_id = :route_id
                  AND t2.direction_id = :direction_id
                GROUP BY st2.stop_id, st2.stop_sequence
            ) sub ON st.stop_id = sub.stop_id
                  AND st.stop_sequence = sub.stop_sequence
                  AND st.arrival_time = sub.min_arrival
            JOIN trips t ON t.trip_id = st.trip_id
            JOIN calendar_dates cd ON cd.service_id = t.service_id
            WHERE cd.date = :date
            ORDER BY st.stop_sequence
            """)
        result = await self.session.execute(
            sql,
            {
                "route_id": route_id,
                "direction_id": direction_id,
                "date": parsed_date.isoformat(),
                "time": time,
            },
        )
        return [SimpleNamespace(**row._mapping) for row in result]

    async def get_feed_info(self) -> SimpleNamespace:
        result = await self.session.execute(select(FeedInfo))
        row = result.scalar_one()
        return SimpleNamespace(
            feed_publisher_name=row.feed_publisher_name,
            feed_publisher_url=row.feed_publisher_url,
            feed_lang=row.feed_lang,
            feed_start_date=(str(row.feed_start_date) if row.feed_start_date else None),
            feed_end_date=(str(row.feed_end_date) if row.feed_end_date else None),
            feed_version=row.feed_version,
        )


def _distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle (haversine) distance in meters."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = phi2 - phi1
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * 6371008.8 * math.asin(math.sqrt(a))
