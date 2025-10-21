"""Input validation utilities."""

from typing import Tuple, Optional
from exceptions import ValidationError


def validate_coordinates(latitude: float, longitude: float) -> Tuple[float, float]:
    """
    Validate latitude and longitude values.

    Args:
        latitude: Latitude value
        longitude: Longitude value

    Returns:
        Tuple of validated (latitude, longitude)

    Raises:
        ValidationError: If coordinates are invalid
    """
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        raise ValidationError("Latitude and longitude must be numbers")

    if not -90 <= latitude <= 90:
        raise ValidationError(
            f"Latitude must be between -90 and 90, got {latitude}",
            field="latitude"
        )

    if not -180 <= longitude <= 180:
        raise ValidationError(
            f"Longitude must be between -180 and 180, got {longitude}",
            field="longitude"
        )

    return latitude, longitude


def validate_route_id(route_id: str) -> str:
    """
    Validate route ID.

    Args:
        route_id: Route identifier

    Returns:
        Validated route ID

    Raises:
        ValidationError: If route ID is invalid
    """
    if not route_id or not isinstance(route_id, str):
        raise ValidationError("Route ID must be a non-empty string", field="route_id")

    if len(route_id) > 255:
        raise ValidationError("Route ID too long (max 255 characters)", field="route_id")

    return route_id.strip()


def validate_stop_id(stop_id: str) -> str:
    """
    Validate stop ID.

    Args:
        stop_id: Stop identifier

    Returns:
        Validated stop ID

    Raises:
        ValidationError: If stop ID is invalid
    """
    if not stop_id or not isinstance(stop_id, str):
        raise ValidationError("Stop ID must be a non-empty string", field="stop_id")

    if len(stop_id) > 255:
        raise ValidationError("Stop ID too long (max 255 characters)", field="stop_id")

    return stop_id.strip()


def validate_radius(radius: Optional[float], max_radius: float = 5000) -> float:
    """
    Validate search radius.

    Args:
        radius: Search radius in meters
        max_radius: Maximum allowed radius

    Returns:
        Validated radius

    Raises:
        ValidationError: If radius is invalid
    """
    if radius is None:
        return 1000  # Default radius

    if not isinstance(radius, (int, float)):
        raise ValidationError("Radius must be a number", field="radius")

    if radius <= 0:
        raise ValidationError("Radius must be positive", field="radius")

    if radius > max_radius:
        raise ValidationError(
            f"Radius exceeds maximum of {max_radius} meters",
            field="radius"
        )

    return float(radius)
