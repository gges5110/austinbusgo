"""Service for search operations across stops and routes."""

from typing import List, Dict
from services.gtfs_service import GTFSService
from models.gtfs_models import Stops, Routes
from utils.logging import get_logger

logger = get_logger(__name__)


class SearchService:
    """Service for handling search queries across GTFS data."""

    def __init__(self, gtfs_service: GTFSService):
        """
        Initialize SearchService.

        Args:
            gtfs_service: GTFS static data service
        """
        self.gtfs_service = gtfs_service

    def search(self, search_term: str) -> Dict[str, List]:
        """
        Search for stops and routes matching the search term.

        Args:
            search_term: Search query string

        Returns:
            Dictionary with 'stops' and 'routes' lists
        """
        search_terms = search_term.split(" ")

        return {
            "stops": self.gtfs_service.get_stops_by_name(search_terms),
            "routes": self.gtfs_service.get_routes_by_name(search_terms),
        }

    def search_stops_by_name(self, stop_name: str) -> List[Stops]:
        """
        Search for stops by name.

        Args:
            stop_name: Stop name to search for

        Returns:
            List of matching stops
        """
        return self.gtfs_service.get_stops_by_name(stop_name) or []

    def search_nearby_stops(
        self, lat: float, lon: float, distance: float = 0.01
    ) -> List[Stops]:
        """
        Search for stops near a geographic location.

        Args:
            lat: Latitude
            lon: Longitude
            distance: Search radius (default 0.01)

        Returns:
            List of nearby stops
        """
        return self.gtfs_service.get_near_by_stops(lat, lon, distance) or []
