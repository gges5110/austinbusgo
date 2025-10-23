import os

# Database connection URL
# Expected format: postgresql://user:password@host:port/database?sslmode=mode
db_url = os.environ.get("DATABASE_URL")

capital_metro_trip_updates_pb_file_url = (
    "https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream"
)
capital_metro_vehicle_positions_pb_file_url = (
    "https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream"
)
