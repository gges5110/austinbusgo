from playhouse.flask_utils import FlaskDB


# Custom FlaskDB that handles already-open connections
class SafeFlaskDB(FlaskDB):
    def connect_db(self):
        """Only connect if database is closed to avoid 'Connection already opened' errors."""
        if self.database.is_closed():
            self.database.connect()


# This module is for connecting to database
db_wrapper = SafeFlaskDB()
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
