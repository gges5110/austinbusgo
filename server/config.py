"""
DEPRECATED: This module is kept for backwards compatibility.
Please import from server.config instead.
"""

# Import from new config structure
from server.config.base import Config
from server.config.agencies import CAPITAL_METRO, DEFAULT_AGENCY
from server.config.constants import *

# Backwards compatibility exports
db_url = Config.get_database_url()
capital_metro_trip_updates_pb_file_url = CAPITAL_METRO.trip_updates_url
capital_metro_vehicle_positions_pb_file_url = CAPITAL_METRO.vehicle_positions_url

__all__ = [
    'Config',
    'CAPITAL_METRO',
    'DEFAULT_AGENCY',
    'db_url',
    'capital_metro_trip_updates_pb_file_url',
    'capital_metro_vehicle_positions_pb_file_url'
]
