"""Composite resolver that combines all feature resolvers."""

from sqlalchemy.ext.asyncio import AsyncSession

from server.gql.resolvers.arrivals import ArrivalsResolver
from server.gql.resolvers.real_time import RealTimeResolver
from server.gql.resolvers.routes import RoutesResolver
from server.gql.resolvers.search import SearchResolver
from server.gql.resolvers.stops import StopsResolver
from server.gql.resolvers.trips import TripsResolver
from server.services.gtfs_service import GTFSService


class Resolver:
    """Composite resolver combining all feature-specific resolvers."""

    def __init__(self, session: AsyncSession, gtfs_service: GTFSService = None):
        self.routes = RoutesResolver(session, gtfs_service)
        self.stops = StopsResolver(session, gtfs_service)
        self.trips = TripsResolver(session, gtfs_service)
        self.real_time = RealTimeResolver(session, gtfs_service)
        self.search = SearchResolver(session, gtfs_service)
        self.arrivals = ArrivalsResolver(session, gtfs_service)
        self.gtfs_service = gtfs_service or GTFSService(session)

    async def resolve_feed_info(self):
        """Get GTFS feed information."""
        return await self.gtfs_service.get_feed_info()
