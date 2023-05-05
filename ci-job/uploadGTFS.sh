#!/bin/sh

psql $DATABASE_URL --file=server/database/schema.sql