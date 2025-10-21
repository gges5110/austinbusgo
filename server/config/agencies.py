"""Transit agency configurations."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class AgencyConfig:
    """Configuration for a transit agency's GTFS-RT feeds."""

    name: str
    trip_updates_url: Optional[str] = None
    vehicle_positions_url: Optional[str] = None
    service_alerts_url: Optional[str] = None
    timezone: str = "America/Chicago"


# Capital Metro (Austin, TX) configuration
CAPITAL_METRO = AgencyConfig(
    name="Capital Metro",
    trip_updates_url="https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream",
    vehicle_positions_url="https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream",
    timezone="America/Chicago"
)

# Default agency (currently Capital Metro)
DEFAULT_AGENCY = CAPITAL_METRO
