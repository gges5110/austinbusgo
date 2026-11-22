import os

# Path to the read-only GTFS SQLite database built by etl/build_db.py
db_path = os.environ.get("GTFS_DB_PATH")

capital_metro_trip_updates_pb_file_url = (
    "https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream"
)
capital_metro_vehicle_positions_pb_file_url = (
    "https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream"
)

# Shared with the edge-cache worker, which sends it as X-Origin-Auth. When
# set, requests without it are refused, so the Cloud Run URL can't be used
# to get around the worker's cache and rate limit. Unset (local dev, tests):
# no check.
origin_secret = os.environ.get("ORIGIN_SECRET") or None
