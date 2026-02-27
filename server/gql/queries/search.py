"""Search query fields."""

import strawberry
from strawberry.types import Info

from server.gql.types.response_types import Search


@strawberry.type
class SearchQueries:
    @strawberry.field
    async def search(self, info: Info, search_term: str, limit: int = 8) -> Search:
        return await info.context.resolver.search.resolve_search(search_term, limit)
