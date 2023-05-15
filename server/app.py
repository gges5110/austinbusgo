import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from graphql_server.flask import GraphQLView

from server.config import db_url
from server.database import db_wrapper, database_sanity_check
from server.gql.schema import schema
from werkzeug.middleware.profiler import ProfilerMiddleware
import logging

static_folder_root = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client", "build"
)


def create_app():
    austin_bus_go_app = Flask(__name__, static_folder=static_folder_root)

    if austin_bus_go_app.debug:
        # Print all queries to stderr.
        logger = logging.getLogger("peewee")
        logger.addHandler(logging.StreamHandler())
        logger.setLevel(logging.DEBUG)
        #     austin_bus_go_app.wsgi_app = ProfilerMiddleware(austin_bus_go_app.wsgi_app)

    @austin_bus_go_app.route("/", defaults={"path": ""})
    @austin_bus_go_app.route("/<path:path>")
    def catch_all(path):
        if path != "" and os.path.exists(os.path.join(static_folder_root, path)):
            return send_from_directory(static_folder_root, path)
        else:
            return send_from_directory(static_folder_root, "index.html")

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
