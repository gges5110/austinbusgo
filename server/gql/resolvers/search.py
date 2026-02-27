"""Search resolver methods."""

from server.gql.resolvers.base import BaseResolver
from server.gql.types.response_types import Search


class SearchResolver(BaseResolver):
    """Resolver for search functionality."""

    async def resolve_search(self, search_term: str, limit: int = 8) -> Search:
        search_terms = search_term.split(" ")
        stops = await self.gtfs_service.get_stops_by_name(search_terms, limit=limit)
        routes = await self.gtfs_service.get_routes_by_name(search_terms, limit=limit)
        return Search(stops=list(stops), routes=list(routes))
