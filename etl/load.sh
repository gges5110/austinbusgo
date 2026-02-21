#!/bin/sh

cd "$(dirname "$0")"

psql $DATABASE_URL --file=teardown.sql
psql $DATABASE_URL --file=schema.sql
psql $DATABASE_URL --file=load.sql
