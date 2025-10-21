"""Flask application factory."""

import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from graphql_server.flask import GraphQLView

from server.config import Config
from server.database import db_wrapper, database_sanity_check
from server.gql.schema import schema
from server.utils.logging import setup_logging, get_logger
from server.middleware import register_error_handlers, LoggingMiddleware
from werkzeug.middleware.profiler import ProfilerMiddleware

# Setup application logging
setup_logging()
logger = get_logger(__name__)

static_folder_root = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client", "build"
)


def create_app():
    """
    Create and configure the Flask application.

    Returns:
        Flask: Configured Flask application instance
    """
    austin_bus_go_app = Flask(__name__, static_folder=static_folder_root)

    logger.info("Initializing Austin Bus Go application")

    if austin_bus_go_app.debug or Config.is_debug():
        # Print all database queries to stderr in debug mode
        import logging as log
        peewee_logger = log.getLogger("peewee")
        peewee_logger.addHandler(log.StreamHandler())
        peewee_logger.setLevel(log.DEBUG)
        logger.info("Debug mode enabled - database query logging active")

    @austin_bus_go_app.route("/", defaults={"path": ""})
    @austin_bus_go_app.route("/<path:path>")
    def catch_all(path):
        if path != "" and os.path.exists(os.path.join(static_folder_root, path)):
            return send_from_directory(static_folder_root, path)
        else:
            return send_from_directory(static_folder_root, "index.html")

    # GraphQL endpoint
    austin_bus_go_app.add_url_rule(
        "/graphql",
        view_func=GraphQLView.as_view("graphql", schema=schema, graphiql=True),
    )
    CORS(austin_bus_go_app, resources={r"/graphql": {"origins": "*"}})

    # Register middleware
    LoggingMiddleware(austin_bus_go_app)
    register_error_handlers(austin_bus_go_app)
    logger.info("Middleware and error handlers registered")

    # Database configuration
    db_url = Config.get_database_url()
    if db_url is None:
        logger.error("Database URL not configured")
        raise RuntimeError("Environment variable $DATABASE_URL was not set")

    austin_bus_go_app.config["DATABASE"] = db_url
    logger.info(f"Database configured: {db_url.split('@')[1] if '@' in db_url else 'local'}")

    # Initialize database wrapper (sets up pre/post-request connection handlers)
    db_wrapper.init_app(austin_bus_go_app)
    database_sanity_check()
    logger.info("Database sanity check passed")

    logger.info("Austin Bus Go application initialized successfully")
    return austin_bus_go_app
