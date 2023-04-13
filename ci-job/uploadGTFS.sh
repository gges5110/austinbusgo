#!/bin/sh

psql $DATABASE_URL --file=server/schema.sql