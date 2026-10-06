"""Build the read-only SQLite GTFS database from the prepared CSV files.

The output file is baked into the backend's Docker image, so the build is
all-or-nothing: everything is written to a temporary file that only
replaces the destination once it is complete.
"""

import csv
import json
import os
import re
import sqlite3
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
SQL_DIR = SCRIPT_DIR / "sql"
CAPMETRO_DIR = SCRIPT_DIR / "capmetro"
DEFAULT_DB_PATH = SCRIPT_DIR / "gtfs.db"

# Tables loaded straight from the GTFS file of the same name
PLAIN_TABLES = [
    "agency",
    "routes",
    "trips",
    "stop_times",
    "calendar_dates",
    "transfers",
]

# GTFS dates are YYYYMMDD; the database stores ISO dates
DATE_COLUMNS = {
    "feed_info": ["feed_start_date", "feed_end_date"],
    "calendar_dates": ["date"],
}

_WKT_POINT = re.compile(r"POINT\s*\(\s*(\S+)\s+(\S+)\s*\)")


def _read_csv(path: Path):
    # Several CapMetro files start with a UTF-8 BOM
    with open(path, newline="", encoding="utf-8-sig") as f:
        yield from csv.DictReader(f)


def _empty_to_none(value):
    # Matches Postgres COPY ... CSV, which loaded empty fields as NULL
    return None if value == "" else value


def _iso_date(value):
    if not value:
        return None
    return datetime.strptime(value, "%Y%m%d").date().isoformat()


def _lon_lat(row: dict, prefix: str):
    """Read a point as (lon, lat) from either lat/lon columns or WKT.

    prepare.py rewrites `<prefix>_lat`/`<prefix>_lon` into a WKT
    `<prefix>_loc` column; accept both so the loader doesn't depend on it.
    """
    if row.get(f"{prefix}_lat"):
        return float(row[f"{prefix}_lon"]), float(row[f"{prefix}_lat"])
    match = _WKT_POINT.fullmatch(row[f"{prefix}_loc"].strip())
    if match is None:
        raise ValueError(f"Unparseable {prefix}_loc: {row[f'{prefix}_loc']!r}")
    return float(match.group(1)), float(match.group(2))


def _table_columns(conn: sqlite3.Connection, table: str):
    return [row[1] for row in conn.execute(f"PRAGMA table_info({table})")]


def _insert_rows(conn: sqlite3.Connection, table: str, rows) -> int:
    columns = _table_columns(conn, table)
    placeholders = ", ".join("?" for _ in columns)
    sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})"
    dates = DATE_COLUMNS.get(table, [])

    def values():
        for row in rows:
            for column in dates:
                row[column] = _iso_date(row.get(column))
            yield tuple(_empty_to_none(row.get(column)) for column in columns)

    cursor = conn.executemany(sql, values())
    return cursor.rowcount


def _stop_rows(csv_dir: Path):
    for row in _read_csv(csv_dir / "stops.txt"):
        lon, lat = _lon_lat(row, "stop")
        row["stop_lon"] = lon
        row["stop_lat"] = lat
        row["stop_loc"] = json.dumps({"type": "Point", "coordinates": [lon, lat]})
        yield row


def _shape_rows(csv_dir: Path):
    points = defaultdict(list)
    for row in _read_csv(csv_dir / "shapes.txt"):
        points[row["shape_id"]].append(
            (int(row["shape_pt_sequence"]), _lon_lat(row, "shape_pt"))
        )
    for shape_id, shape_points in points.items():
        shape_points.sort()
        coordinates = [list(lon_lat) for _, lon_lat in shape_points]
        yield {
            "shape_id": shape_id,
            "shape": json.dumps({"type": "LineString", "coordinates": coordinates}),
        }


def build_database(csv_dir: Path = CAPMETRO_DIR, db_path: Path = DEFAULT_DB_PATH):
    """Build a fresh SQLite database at db_path from the GTFS CSVs."""
    db_path = Path(db_path)
    tmp_path = db_path.with_name(db_path.name + ".tmp")
    tmp_path.unlink(missing_ok=True)

    conn = sqlite3.connect(tmp_path)
    try:
        # The file is rebuilt from scratch on failure, so durability during
        # the load buys nothing
        conn.execute("PRAGMA journal_mode = OFF")
        conn.execute("PRAGMA synchronous = OFF")
        conn.executescript((SQL_DIR / "schema.sql").read_text())

        with conn:
            counts = {
                "feed_info": _insert_rows(
                    conn, "feed_info", _read_csv(csv_dir / "feed_info.txt")
                ),
                "stops": _insert_rows(conn, "stops", _stop_rows(csv_dir)),
                "shapes_aggregated": _insert_rows(
                    conn, "shapes_aggregated", _shape_rows(csv_dir)
                ),
            }
            for table in PLAIN_TABLES:
                counts[table] = _insert_rows(
                    conn, table, _read_csv(csv_dir / f"{table}.txt")
                )
            conn.executescript((SQL_DIR / "derived.sql").read_text())

        for table, count in counts.items():
            print(f"  {table}: {count} rows")

        print("Creating indexes...")
        conn.executescript((SQL_DIR / "indexes.sql").read_text())
        conn.execute("ANALYZE")
        conn.execute("VACUUM")
    finally:
        conn.close()

    os.replace(tmp_path, db_path)
    print(f"Wrote {db_path} ({db_path.stat().st_size / 1e6:.1f} MB)")
    return db_path


def get_feed_info(db_path: Path = DEFAULT_DB_PATH) -> dict:
    conn = sqlite3.connect(db_path)
    try:
        conn.row_factory = sqlite3.Row
        return dict(conn.execute("SELECT * FROM feed_info LIMIT 1").fetchone())
    finally:
        conn.close()


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DB_PATH
    build_database(db_path=target)
