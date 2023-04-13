#!/usr/bin/env python3
import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_graphql import GraphQLView

from server.gql.schema import schema

static_folder_root = os.path.join(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))), "client", "build")


def create_app():
    austin_bus_go_app = Flask(__name__, static_folder=static_folder_root)

    @austin_bus_go_app.route("/", defaults={'path': ''})
    @austin_bus_go_app.route('/<path:path>')
    def catch_all(path):
        if path != "" and os.path.exists(os.path.join(static_folder_root, path)):
            return send_from_directory(static_folder_root, path)
        else:
            return send_from_directory(static_folder_root, 'index.html')

    austin_bus_go_app.add_url_rule(
        '/graphql', view_func=GraphQLView.as_view('graphql', schema=schema, graphiql=True))
    CORS(austin_bus_go_app, resources={r'/graphql': {'origins': '*'}})

    from server.database import db

    @austin_bus_go_app.before_request
    def _db_connect():
        db.connect()

    # This hook ensures that the connection is closed when we've finished processing the request.
    @austin_bus_go_app.teardown_request
    def _db_close(exc):
        if not db.is_closed():
            db.close()

    return austin_bus_go_app
