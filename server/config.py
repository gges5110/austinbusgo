import os
from urllib.parse import quote_plus

# Try DATABASE_URL first, otherwise build from PG* environment variables
db_url = os.environ.get("DATABASE_URL")
if not db_url and os.environ.get("PGHOST"):
    pghost = os.environ.get("PGHOST")
    pgport = os.environ.get("PGPORT", "5432")
    pguser = os.environ.get("PGUSER")
    pgpassword = os.environ.get("PGPASSWORD")
    pgdatabase = os.environ.get("PGDATABASE", "postgres")
    pgsslmode = os.environ.get("PGSSLMODE", "prefer")

    # Build DATABASE_URL, properly encoding the password
    # The password (IAM token) contains special chars, so we URL-encode it
    encoded_password = quote_plus(pgpassword) if pgpassword else ""
    db_url = f"postgresql://{pguser}:{encoded_password}@{pghost}:{pgport}/{pgdatabase}?sslmode={pgsslmode}"

capital_metro_trip_updates_pb_file_url = (
    "https://data.texas.gov/download/rmk2-acnw/application%2Foctet-stream"
)
capital_metro_vehicle_positions_pb_file_url = (
    "https://data.texas.gov/download/eiei-9rpf/application%2Foctet-stream"
)
