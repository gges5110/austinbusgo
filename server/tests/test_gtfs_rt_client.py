import httpx
import pytest
from google.transit.gtfs_realtime_pb2 import (
    FeedMessage,
    FeedEntity,
    TripUpdate,
    VehiclePosition,
    TripDescriptor,
)
from server.services.gtfs_rt_client import (
    GTFSRTClient,
    RealtimeFeedError,
    clear_feed_cache,
    feed_stats,
)

mock_trip_updates_pb_file_url = "http://url1"
mock_vehicle_positions_pb_file_url = "http://url2"


@pytest.fixture(autouse=True)
def empty_feed_cache():
    clear_feed_cache()
    yield
    clear_feed_cache()


@pytest.fixture
def client():
    return GTFSRTClient(
        mock_trip_updates_pb_file_url, mock_vehicle_positions_pb_file_url
    )


def get_mock_feed_entity():
    feed_entity = FeedEntity()
    feed_entity.id = "1"
    return feed_entity


def get_mock_trip(route_id="2"):
    trip = TripDescriptor()
    trip.route_id = route_id
    return trip


def get_mock_trip_update():
    trip_update = TripUpdate()
    trip = get_mock_trip()
    trip_update.trip.CopyFrom(trip)
    return trip_update


@pytest.mark.asyncio
async def test_load_trip_updates(client, mocker):
    mock_get = mocker.patch(
        "server.services.gtfs_rt_client.GTFSRTClient._get_feed_message_entity_from_url",
        new_callable=mocker.AsyncMock,
    )

    feed_message = FeedMessage()
    feed_entity = get_mock_feed_entity()
    trip_update = get_mock_trip_update()
    feed_entity.trip_update.CopyFrom(trip_update)
    feed_message.entity.append(feed_entity)

    mock_get.return_value = feed_message.entity

    trip_updates = await client.load_trip_updates()

    mock_get.assert_called_with(mock_trip_updates_pb_file_url)
    assert len(trip_updates) == 1
    assert trip_updates[0] == trip_update


def make_feed_bytes(entity_id="1"):
    feed_message = FeedMessage()
    feed_message.header.gtfs_realtime_version = "2.0"
    feed_message.entity.add().id = entity_id
    return feed_message.SerializeToString()


def mock_async_client(mocker, content=None, error=None):
    """Patch httpx.AsyncClient; return the mock for its .get method."""
    response = mocker.Mock()
    response.content = content
    response.raise_for_status = mocker.Mock()
    get = mocker.AsyncMock(return_value=response, side_effect=error)
    instance = mocker.MagicMock()
    instance.get = get
    instance.__aenter__ = mocker.AsyncMock(return_value=instance)
    instance.__aexit__ = mocker.AsyncMock(return_value=False)
    mocker.patch(
        "server.services.gtfs_rt_client.httpx.AsyncClient", return_value=instance
    )
    return get


@pytest.mark.asyncio
async def test_get_feed_message_entity_from_url(mocker):
    get = mock_async_client(mocker, content=make_feed_bytes("1"))

    result = await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")

    get.assert_called_once_with("http://test-url")
    assert len(result) == 1
    assert result[0].id == "1"


@pytest.mark.asyncio
async def test_feed_is_cached_within_ttl(mocker):
    get = mock_async_client(mocker, content=make_feed_bytes())

    await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")
    await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")

    assert get.call_count == 1


@pytest.mark.asyncio
async def test_feed_is_refetched_after_ttl(mocker):
    get = mock_async_client(mocker, content=make_feed_bytes())
    clock = mocker.patch("server.services.gtfs_rt_client.time.monotonic")
    clock.return_value = 100.0
    await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")
    clock.return_value = 111.0

    await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")

    assert get.call_count == 2


@pytest.mark.asyncio
async def test_fetch_failure_raises_realtime_feed_error(mocker):
    mock_async_client(mocker, error=httpx.ReadTimeout("slow"))

    with pytest.raises(RealtimeFeedError):
        await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")

    stats = feed_stats("http://test-url")
    assert stats["failures"] == 1
    assert stats["successes"] == 0
    assert stats["last_error"] == "ReadTimeout: slow"


@pytest.mark.asyncio
async def test_a_timeout_without_a_message_still_says_what_happened(mocker):
    mock_async_client(mocker, error=httpx.ConnectTimeout(""))

    with pytest.raises(RealtimeFeedError, match="^ConnectTimeout$"):
        await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")


@pytest.mark.asyncio
async def test_a_slow_download_keeps_going_for_the_next_request(mocker):
    import asyncio

    mocker.patch("server.services.gtfs_rt_client.WAIT_WITHOUT_COPY_SECONDS", 0.01)
    release = asyncio.Event()
    get = mock_async_client(mocker, content=make_feed_bytes("1"))
    response = get.return_value

    async def slow_get(url):
        await release.wait()
        return response

    get.side_effect = slow_get

    # A fresh worker: the first rider gets scheduled times quickly...
    with pytest.raises(RealtimeFeedError, match="still downloading"):
        await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")

    # ...and the download it started serves the next one
    release.set()
    result = await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")
    assert result[0].id == "1"
    assert get.call_count == 1


@pytest.mark.asyncio
async def test_a_failed_fetch_serves_the_last_copy_for_two_minutes(mocker):
    get = mock_async_client(mocker, content=make_feed_bytes("old"))
    clock = mocker.patch("server.services.gtfs_rt_client.time.monotonic")
    clock.return_value = 100.0
    await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")
    get.side_effect = httpx.ConnectTimeout("")

    clock.return_value = 160.0
    result = await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")

    assert result[0].id == "old"
    assert get.call_count == 2
    assert feed_stats("http://test-url")["serving_stale"] is True

    clock.return_value = 230.0
    with pytest.raises(RealtimeFeedError):
        await GTFSRTClient._get_feed_message_entity_from_url("http://test-url")


@pytest.mark.asyncio
async def test_concurrent_requests_share_one_fetch(mocker):
    import asyncio

    release = asyncio.Event()
    get = mock_async_client(mocker, content=make_feed_bytes("1"))
    response = get.return_value

    async def slow_get(url):
        await release.wait()
        return response

    get.side_effect = slow_get
    requests = [
        asyncio.ensure_future(
            GTFSRTClient._get_feed_message_entity_from_url("http://test-url")
        )
        for _ in range(5)
    ]
    await asyncio.sleep(0)
    release.set()
    results = await asyncio.gather(*requests)

    assert get.call_count == 1
    assert all(result[0].id == "1" for result in results)


@pytest.mark.asyncio
async def test_load_vehicle_positions(client, mocker):
    mock_get = mocker.patch(
        "server.services.gtfs_rt_client.GTFSRTClient._get_feed_message_entity_from_url",
        new_callable=mocker.AsyncMock,
    )

    feed_message = FeedMessage()
    feed_entity = get_mock_feed_entity()
    vehicle_position = VehiclePosition()
    trip = get_mock_trip()
    vehicle_position.trip.CopyFrom(trip)
    feed_entity.vehicle.CopyFrom(vehicle_position)
    feed_message.entity.append(feed_entity)

    mock_get.return_value = feed_message.entity

    vehicle_positions = await client.load_vehicle_positions()

    mock_get.assert_called_with(mock_vehicle_positions_pb_file_url)
    assert len(vehicle_positions) == 1
    assert vehicle_positions[0] == vehicle_position


@pytest.mark.asyncio
async def test_load_vehicle_positions_with_route_id(client, mocker):
    mock_get = mocker.patch(
        "server.services.gtfs_rt_client.GTFSRTClient._get_feed_message_entity_from_url",
        new_callable=mocker.AsyncMock,
    )

    feed_message = FeedMessage()
    feed_entity = get_mock_feed_entity()
    vehicle_position = VehiclePosition()
    trip = get_mock_trip("3")
    vehicle_position.trip.CopyFrom(trip)
    feed_entity.vehicle.CopyFrom(vehicle_position)
    feed_message.entity.append(feed_entity)

    mock_get.return_value = feed_message.entity

    vehicle_positions = await client.load_vehicle_positions("3")

    mock_get.assert_called_with(mock_vehicle_positions_pb_file_url)
    assert len(vehicle_positions) == 1
    assert vehicle_positions[0] == vehicle_position
