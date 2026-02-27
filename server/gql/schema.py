"""GraphQL schema combining all feature queries."""

import strawberry
from strawberry.types import Info

from server.gql.types.gtfs_types import FeedInfo
from server.gql.queries.arrivals import ArrivalQueries
from server.gql.queries.real_time import RealTimeQueries
from server.gql.queries.routes import RouteQueries
from server.gql.queries.search import SearchQueries
from server.gql.queries.stops import StopQueries
from server.gql.queries.trips import TripQueries


@strawberry.type
class Query(
    ArrivalQueries,
    RealTimeQueries,
    RouteQueries,
    SearchQueries,
    StopQueries,
    TripQueries,
):
    @strawberry.field
    async def feed_info(self, info: Info) -> FeedInfo:
        """Get GTFS feed information."""
        return await info.context.resolver.resolve_feed_info()


schema = strawberry.Schema(query=Query)
