from playhouse.pool import PooledPostgresqlExtDatabase
from peewee import Model

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

database = PooledPostgresqlExtDatabase(None)  # deferred init


class BaseModel(Model):
    class Meta:
        database = database


class _DBWrapper:
    """Thin wrapper that exposes .Model (for gtfs_models.py) and delegates
    all other attribute access to the underlying database instance."""

    Model = BaseModel

    def __getattr__(self, name: str):
        return getattr(database, name)


# Preserve `from server.database import db_wrapper` imports in models
db_wrapper = _DBWrapper()


def database_sanity_check():
    try:
        database.connect()
        tables = database.get_tables()
        tables_set = set(tables)
        if len(ALL_TABLES_SET.difference(tables_set)):
            raise RuntimeError(
                "Some of the tables are missing: {}".format(
                    ALL_TABLES_SET.difference(tables_set)
                )
            )
    finally:
        if not database.is_closed():
            database.close()
