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
    tables = db_wrapper.database.get_tables()
    tables_set = set(tables)
    if len(ALL_TABLES_SET.difference(tables_set)):
        raise RuntimeError(
            "Some of the tables are missing: {}".format(
                ALL_TABLES_SET.difference(tables_set)
            )
        )
