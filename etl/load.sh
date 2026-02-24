#!/bin/sh

cd "$(dirname "$0")"

# ---------------------------------------------------------------------------
# Feed version check: skip the expensive reload when the feed hasn't changed.
# Compares feed_start_date from the freshly-downloaded feed_info.txt against
# what is currently stored in the database.
# ---------------------------------------------------------------------------
CURRENT_FEED_START=$(psql "$DATABASE_URL" -t -c \
  "SELECT to_char(feed_start_date, 'YYYYMMDD') FROM feed_info LIMIT 1;" \
  2>/dev/null | tr -d ' \n')

NEW_FEED_START=$(python3 - <<'EOF'
import csv
with open("capmetro/feed_info.txt") as f:
    for row in csv.DictReader(f):
        print(row["feed_start_date"].strip())
        break
EOF
)

if [ -n "$CURRENT_FEED_START" ] && [ "$CURRENT_FEED_START" = "$NEW_FEED_START" ]; then
  echo "Feed start date unchanged ($CURRENT_FEED_START), skipping database reload."
  exit 0
fi

echo "Loading new GTFS feed (feed_start_date: $NEW_FEED_START, was: ${CURRENT_FEED_START:-none})"

# ---------------------------------------------------------------------------
# Reload: drop -> create schema (no indexes yet) -> bulk COPY -> create indexes.
#
# Indexes are intentionally created AFTER the bulk load.  Building them on an
# already-populated table is far faster than maintaining them incrementally
# during each COPY row insertion, especially for the large stop_times table.
# ---------------------------------------------------------------------------
psql "$DATABASE_URL" --file=teardown.sql
psql "$DATABASE_URL" --file=schema.sql
psql "$DATABASE_URL" --file=load.sql
psql "$DATABASE_URL" --file=indexes.sql
