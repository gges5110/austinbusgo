from flask import Flask
from flask_cors import CORS
from graphql_server.flask import GraphQLView

from server.config import db_url
from server.database import db_wrapper, database_sanity_check
from server.gql.schema import schema
import logging


def create_app():
    austin_bus_go_app = Flask(__name__)

    if austin_bus_go_app.debug:
        # Print all queries to stderr.
        logger = logging.getLogger("peewee")
        logger.addHandler(logging.StreamHandler())
        logger.setLevel(logging.DEBUG)

    # GraphQL
    austin_bus_go_app.add_url_rule(
        "/graphql",
        view_func=GraphQLView.as_view("graphql", schema=schema, graphiql=True),
    )
    CORS(austin_bus_go_app, resources={r"/graphql": {"origins": "*"}})

    # Database
    austin_bus_go_app.config["DATABASE"] = db_url
    if db_url is None:
        raise RuntimeError("Environment variable $DATABASE_URL was not set")

    db_wrapper.init_app(austin_bus_go_app)
    database_sanity_check()

    return austin_bus_go_app
