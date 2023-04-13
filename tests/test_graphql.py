import json
import unittest

from graphene.test import Client
from peewee import SqliteDatabase

from models.gtfs_models import Stops
from gql.schema import schema

MODELS = [Stops]

database = SqliteDatabase(':memory:')


class TestCase(unittest.TestCase):
    """ Internal integration test for graphql client """

    def setUp(self):
        database.bind(MODELS)
        database.connect()
        database.create_tables(MODELS)

    def tearDown(self):
        database.drop_tables(MODELS)
        database.close()

    def test_stop(self):
        Stops.create(stop_id=2493, stop_code=2493, stop_name="3107 Red River/32nd", stop_lat=30.290665,
                     stop_lon=-97.727112)

        client = Client(schema)
        executed = client.execute('''
            query {
                stop(stopId: "2493") {
                    stopId
                    stopCode
                    stopName
                    stopLat
                    stopLon
                }
            }
        ''')

        stop = """
            {
                "stopId": 2493,
                "stopCode": "2493",
                "stopName": "3107 Red River/32nd",
                "stopLat": 30.290665,
                "stopLon": -97.727112
            }
        """

        self.assertDictEqual(executed['data']['stop'], json.loads(stop))


if __name__ == '__main__':
    unittest.main()
