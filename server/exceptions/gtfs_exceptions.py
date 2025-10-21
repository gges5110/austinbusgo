"""GTFS-specific exception classes."""

from .base import NotFoundError, ValidationError, ExternalAPIError


class GTFSDataNotFoundError(NotFoundError):
    """Raised when GTFS data is not found."""

    def __init__(self, entity_type: str, identifier: str = None):
        super().__init__(f"GTFS {entity_type}", identifier)


class GTFSValidationError(ValidationError):
    """Raised when GTFS data validation fails."""

    def __init__(self, message: str, field: str = None):
        super().__init__(f"GTFS validation error: {message}", field)


class GTFSRealtimeError(ExternalAPIError):
    """Raised when GTFS real-time feed errors occur."""

    def __init__(self, message: str, feed_type: str = None):
        super().__init__(
            f"GTFS-RT error: {message}",
            api_name=f"GTFS-RT {feed_type}" if feed_type else "GTFS-RT"
        )
        self.feed_type = feed_type
