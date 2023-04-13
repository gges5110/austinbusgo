import unittest
from unittest import TestCase

from peewee import DoesNotExist, SqliteDatabase

from server.services.gtfs_service import GTFSService
from server.models.gtfs_models import Stops, Trips, Shapes, StopTimes, Routes

MODELS = [Stops, Trips, Shapes, StopTimes, Routes]

database = SqliteDatabase(':memory:')


class TestGTFSService(TestCase):
    def setUp(self):
        database.bind(MODELS)
        database.connect()
        database.create_tables(MODELS)

    def tearDown(self):
        database.drop_tables(MODELS)
        database.close()

    # Stops
    def test_get_stop(self):
        stop = Stops.create(stop_id=1)

        self.assertEqual(GTFSService.get_stop(1).stop_id, stop.stop_id)

    def test_get_stop_not_found(self):
        with self.assertRaises(DoesNotExist) as context:
            GTFSService.get_stop(2)

        self.assertTrue('instance matching query does not exist' in str(context.exception))

    # Trips
    def test_get_trip_by_id(self):
        trip = Trips.create(trip_id='trip_1')

        self.assertEqual(GTFSService.get_trip_by_id('trip_1').trip_id, trip.trip_id)

    # Shapes
    def test_get_shapes_by_trip_id(self):
        trip = Trips.create(trip_id='trip_1', shape_id='1')
        shape = Shapes.create(shape_id=trip.shape_id, trip_id=trip.trip_id)

        self.assertEqual(len(GTFSService.get_shapes_by_trip_id('trip_1')), 1)
        self.assertEqual(GTFSService.get_shapes_by_trip_id('trip_1')[0].shape_id, shape.shape_id)

    def test_get_shapes_by_trip_id_not_fount(self):
        with self.assertRaises(DoesNotExist) as context:
            GTFSService.get_shapes_by_trip_id('trip_1')

        self.assertTrue('instance matching query does not exist' in str(context.exception))

    # StopTimes
    def test_get_stop_time(self):
        stop_time = StopTimes.create(trip_id='trip_1', stop_id=123)

        self.assertEqual(GTFSService.get_stop_time('trip_1', 123).trip_id, stop_time.trip_id)
        self.assertEqual(GTFSService.get_stop_time('trip_1', 123).stop_id, stop_time.stop_id)

    def test_get_stop_time_multiple_stop_times_with_same_trip_ids(self):
        stop_time = StopTimes.create(trip_id='trip_1', stop_id=123)
        StopTimes.create(trip_id='trip_1', stop_id=321)

        self.assertEqual(GTFSService.get_stop_time('trip_1', 123).trip_id, stop_time.trip_id)
        self.assertEqual(GTFSService.get_stop_time('trip_1', 123).stop_id, stop_time.stop_id)

    def test_get_stop_time_multiple_stop_times_with_same_stop_ids(self):
        stop_time = StopTimes.create(trip_id='trip_1', stop_id=123)
        StopTimes.create(trip_id='trip_2', stop_id=123)

        self.assertEqual(GTFSService.get_stop_time('trip_1', 123).trip_id, stop_time.trip_id)
        self.assertEqual(GTFSService.get_stop_time('trip_1', 123).stop_id, stop_time.stop_id)

    def test_get_stop_time_no_match(self):
        StopTimes.create(trip_id='trip_1', stop_id=123)
        StopTimes.create(trip_id='trip_2', stop_id=123)
        with self.assertRaises(DoesNotExist) as context:
            GTFSService.get_stop_time('trip_3', 123)

        self.assertTrue('instance matching query does not exist' in str(context.exception))

    def test_get_stops_by_trip_id(self):
        stop1 = Stops.create(stop_id=1)
        stop2 = Stops.create(stop_id=2)
        StopTimes.create(trip_id='trip_1', stop_id=stop1.stop_id)
        StopTimes.create(trip_id='trip_1', stop_id=stop2.stop_id)
        trip = Trips.create(trip_id='trip_1')

        stops = GTFSService.get_stops_by_trip_id([trip.trip_id])
        self.assertEqual(len(stops), 2)
        self.assertEqual(stops[0].stop_id, stop1.stop_id)
        self.assertEqual(stops[1].stop_id, stop2.stop_id)

    def test_get_trips_with_direction_and_route(self):
        Trips.create(trip_id='trip_1', route_id=3, direction_id=True)
        Trips.create(trip_id='trip_2', route_id=3, direction_id=False)
        Trips.create(trip_id='trip_3', route_id=3, direction_id=True)

        trips = GTFSService.get_trips_with_direction_and_route(['trip_1', 'trip_3'], 3, True)
        self.assertEqual(len(trips), 2)

    def test_get_trips_with_distinct_headsign(self):
        trip_ids = ['trip_1', 'trip_2', 'trip_3', 'trip_4']

        Trips.create(trip_id='trip_1', route_id=3, direction_id=True, trip_headsign='1-Lamar/South Congress SB')
        Trips.create(trip_id='trip_2', route_id=3, direction_id=False, trip_headsign='1-Lamar/South Congress NB')
        Trips.create(trip_id='trip_3', route_id=3, direction_id=True, trip_headsign='1-Lamar/South Congress SB')
        Trips.create(trip_id='trip_4', route_id=3, direction_id=False, trip_headsign='1-Lamar/South Congress NB')
        Routes.create(route_id=3)

        trips_with_distinct_headsign = GTFSService.get_trips_with_distinct_headsign(trip_ids)

        # Calling get_trips_with_distinct_headsign would fail because distinct operator only exists on psql and not
        # sqlite. We will need to setup a psql database for testing.
        # self.assertEqual(len(trips_with_distinct_headsign), 2)


if __name__ == '__main__':
    unittest.main()
