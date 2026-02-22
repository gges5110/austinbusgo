from typing import Optional

import strawberry


@strawberry.input
class TripUpdatesFilter:
    trip_id: Optional[str] = None
    route_id: Optional[str] = None
