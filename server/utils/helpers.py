"""Helper utility functions."""

from datetime import datetime, time
from typing import Optional


def parse_time(time_str: str) -> Optional[time]:
    """
    Parse a time string in HH:MM:SS format.

    Args:
        time_str: Time string (e.g., "14:30:00")

    Returns:
        datetime.time object or None if parsing fails
    """
    if not time_str:
        return None

    try:
        parts = time_str.split(":")
        if len(parts) != 3:
            return None

        hours, minutes, seconds = map(int, parts)

        # GTFS allows hours >= 24 for trips past midnight
        # We'll normalize to standard time
        if hours >= 24:
            hours = hours % 24

        return time(hours, minutes, seconds)
    except (ValueError, AttributeError):
        return None


def format_seconds_to_time(seconds: int) -> str:
    """
    Format seconds since midnight to HH:MM:SS format.

    Args:
        seconds: Seconds since midnight

    Returns:
        Formatted time string
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def seconds_since_midnight(time_obj: time) -> int:
    """
    Convert time object to seconds since midnight.

    Args:
        time_obj: datetime.time object

    Returns:
        Seconds since midnight
    """
    return time_obj.hour * 3600 + time_obj.minute * 60 + time_obj.second


def safe_float(value, default: float = 0.0) -> float:
    """
    Safely convert value to float with default fallback.

    Args:
        value: Value to convert
        default: Default value if conversion fails

    Returns:
        Float value
    """
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value, default: int = 0) -> int:
    """
    Safely convert value to int with default fallback.

    Args:
        value: Value to convert
        default: Default value if conversion fails

    Returns:
        Integer value
    """
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
