import os

from peewee import SqliteDatabase
from playhouse.db_url import connect

# This module is for connecting to database
try:
    db = connect(os.environ["DATABASE_URL"])
except KeyError:
    print("Environment variable DATABASE_URL not set, using in memory Sqlite database for testing purpose.")
    db = SqliteDatabase(':memory:')
