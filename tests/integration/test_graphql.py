import json
import os
import time
import unittest

from graphene.test import Client
from peewee import PostgresqlDatabase, OperationalError

from server.models.gtfs_models import Stops
from server.gql.schema import schema
from testcontainers.compose import DockerCompose

MODELS = [Stops]

database = PostgresqlDatabase(
    user="local-user",
    password="local-password",
    port=5439,
    host="localhost",
    database="local-db",
)
compose = DockerCompose(filepath="./docker/integration-tests")


class TestCase(unittest.TestCase):
    """Internal integration test for graphql client"""

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

        database.create_tables(MODELS)

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

    def test_stop(self):
        Stops.create(
            stop_id=2493,
            stop_code=2493,
            stop_name="3107 Red River/32nd",
            stop_loc=json.dumps({"type": "Point", "coordinates": [125.6, 10.1]}),
        )

        client = Client(schema)
        executed = client.execute(
            """
            query {
                stop(stopId: "2493") {
                    stopId
                    stopCode
                    stopName
                    stopLoc {
                        type
                        coordinates
                    }
                }
            }
        """
        )

        stop = """
            {
                "stopId": "2493",
                "stopCode": "2493",
                "stopName": "3107 Red River/32nd",
                "stopLoc": {"coordinates": [125.6, 10.1], "type": "Point"}
            }
        """
        self.assertFalse("errors" in executed)
        self.assertDictEqual(executed["data"]["stop"], json.loads(stop))


if __name__ == "__main__":
    unittest.main()
