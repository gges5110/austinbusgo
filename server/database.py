from playhouse.flask_utils import FlaskDB

# This module is for connecting to database
db_wrapper = FlaskDB()
ALL_TABLES_SET = {
    "trips",
    "routes",
    "shapes",
    "stop_times",
    "stops",
    "calendar_dates",
    "agency",
    "transfers",
}


def database_sanity_check():
    # 1. Open the connection for this specific check
    try:
        db_wrapper.database.connect()

        # 2. Perform the database operation now that the connection is open
        tables = db_wrapper.database.get_tables()
        tables_set = set(tables)

        if len(ALL_TABLES_SET.difference(tables_set)):
            raise RuntimeError(
                "Some of the tables are missing: {}".format(
                    ALL_TABLES_SET.difference(tables_set)
                )
            )
    finally:
        # 3. CRITICAL: Close the connection after the check is complete
        if not db_wrapper.database.is_closed():
            db_wrapper.database.close()
