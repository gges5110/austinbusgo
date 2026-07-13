"""FastAPI dependencies for the REST API."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from server.config import (
    capital_metro_trip_updates_pb_file_url,
    capital_metro_vehicle_positions_pb_file_url,
)
from server.database import get_db
from server.services.arrival_service import ArrivalService
from server.services.gtfs_rt_client import GTFSRTClient
from server.services.gtfs_rt_service import GTFSRTService
from server.services.gtfs_service import GTFSService


def get_gtfs_service(session: AsyncSession = Depends(get_db)) -> GTFSService:
    return GTFSService(session)


def get_rt_service(
    gtfs_service: GTFSService = Depends(get_gtfs_service),
) -> GTFSRTService:
    client = GTFSRTClient(
        capital_metro_trip_updates_pb_file_url,
        capital_metro_vehicle_positions_pb_file_url,
    )
    return GTFSRTService(gtfs_service, client)


def get_arrival_service(
    gtfs_service: GTFSService = Depends(get_gtfs_service),
    rt_service: GTFSRTService = Depends(get_rt_service),
) -> ArrivalService:
    return ArrivalService(gtfs_service, rt_service)
