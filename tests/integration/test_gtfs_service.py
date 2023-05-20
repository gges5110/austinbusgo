import time
import unittest
from unittest import TestCase

from peewee import DoesNotExist, PostgresqlDatabase, OperationalError
from testcontainers.compose import DockerCompose

from server.services.gtfs_service import GTFSService
from server.models.gtfs_models import Stops, Trips, Shapes, StopTimes, Routes

MODELS = [Stops, Trips, Shapes, StopTimes, Routes]

database = PostgresqlDatabase(
    user="local-user",
    password="local-password",
    port=5439,
    host="localhost",
    database="local-db",
)
compose = DockerCompose(filepath="./docker/integration-tests")


class TestGTFSService(TestCase):
    @classmethod
    def setUpClass(cls):
        compose.start()

        database.bind(MODELS)

        attempts = 0
        while True:
            try:
                database.connect()
                break
            except OperationalError:
                attempts += 1
                print("Waiting for database to start up ({}s)...".format(attempts))
                if attempts > 30:
                    break
                time.sleep(1)

    def setUp(self):
        database.create_tables(MODELS)

    def tearDown(self):
        database.drop_tables(MODELS)

    @classmethod
    def tearDownClass(cls):
        database.close()

        attempts = 0
        while True:
            try:
                database.is_closed()
                break
            except OperationalError:
                attempts += 1
                print("Waiting for database to shut down ({}s)...".format(attempts))
                if attempts > 30:
                    break
                time.sleep(1)

        compose.stop()

    # Stops
    def test_get_stop(self):
        stop = Stops.create(stop_id="1")

        self.assertEqual(GTFSService.get_stop("1").stop_id, stop.stop_id)

    def test_get_stop_not_found(self):
        with self.assertRaises(DoesNotExist) as context:
            GTFSService.get_stop("2")

        self.assertTrue(
            "instance matching query does not exist" in str(context.exception)
        )

    # Trips
    def test_get_trip_by_id(self):
        trip = Trips.create(trip_id="trip_1")

        self.assertEqual(GTFSService.get_trip_by_id("trip_1").trip_id, trip.trip_id)

    # Shapes
    def test_get_shapes_by_trip_id(self):
        trip = Trips.create(trip_id="trip_1", shape_id="1")
        shape = Shapes.create(shape_id=trip.shape_id, trip_id=trip.trip_id)

        self.assertEqual(len(GTFSService.get_shapes_by_trip_id("trip_1")), 1)
        self.assertEqual(
            GTFSService.get_shapes_by_trip_id("trip_1")[0].shape_id, shape.shape_id
        )

    def test_get_shapes_by_trip_id_not_fount(self):
        with self.assertRaises(DoesNotExist) as context:
            GTFSService.get_shapes_by_trip_id("trip_1")

        self.assertTrue(
            "instance matching query does not exist" in str(context.exception)
        )

    # StopTimes
    def test_get_stop_time(self):
        stop_time = StopTimes.create(trip_id="trip_1", stop_id="123")

        self.assertEqual(
            GTFSService.get_stop_time("trip_1", "123").trip_id, stop_time.trip_id
        )
        self.assertEqual(
            GTFSService.get_stop_time("trip_1", "123").stop_id, stop_time.stop_id
        )

    def test_get_stop_time_multiple_stop_times_with_same_trip_ids(self):
        stop_time = StopTimes.create(trip_id="trip_1", stop_id="123")
        StopTimes.create(trip_id="trip_1", stop_id="321")

        self.assertEqual(
            GTFSService.get_stop_time("trip_1", "123").trip_id, stop_time.trip_id
        )
        self.assertEqual(
            GTFSService.get_stop_time("trip_1", "123").stop_id, stop_time.stop_id
        )

    def test_get_stop_time_multiple_stop_times_with_same_stop_ids(self):
        stop_time = StopTimes.create(trip_id="trip_1", stop_id="123")
        StopTimes.create(trip_id="trip_2", stop_id="123")

        self.assertEqual(
            GTFSService.get_stop_time("trip_1", "123").trip_id, stop_time.trip_id
        )
        self.assertEqual(
            GTFSService.get_stop_time("trip_1", "123").stop_id, stop_time.stop_id
        )

    def test_get_stop_time_no_match(self):
        StopTimes.create(trip_id="trip_1", stop_id="123")
        StopTimes.create(trip_id="trip_2", stop_id="123")
        with self.assertRaises(DoesNotExist) as context:
            GTFSService.get_stop_time("trip_3", "123")

        self.assertTrue(
            "instance matching query does not exist" in str(context.exception)
        )

    def test_get_stops_by_trip_id(self):
        stop1 = Stops.create(stop_id="1")
        stop2 = Stops.create(stop_id="2")
        StopTimes.create(trip_id="trip_1", stop_id=stop1.stop_id)
        StopTimes.create(trip_id="trip_1", stop_id=stop2.stop_id)
        trip = Trips.create(trip_id="trip_1")

        stops = GTFSService.get_stops_by_trip_id([trip.trip_id])
        self.assertEqual(len(stops), "2")
        self.assertEqual(stops[0].stop_id, stop1.stop_id)
        self.assertEqual(stops[1].stop_id, stop2.stop_id)

    def test_get_trips_with_direction_and_route(self):
        Trips.create(trip_id="trip_1", route_id=3, direction_id=True)
        Trips.create(trip_id="trip_2", route_id=3, direction_id=False)
        Trips.create(trip_id="trip_3", route_id=3, direction_id=True)

        trips = GTFSService.get_trips_with_direction_and_route(
            ["trip_1", "trip_3"], "3", True
        )
        self.assertEqual(len(trips), 2)


if __name__ == "__main__":
    unittest.main()
