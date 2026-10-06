"""
Tests for the ETL's SQLite builder (etl/build_db.py) on the input shapes the
real CapMetro feed produces after prepare.py.
"""

import json
import sqlite3

from build_db import build_database, get_feed_info


def _write(path, text):
    # The real feed ships some files with a UTF-8 BOM
    path.write_text(text, encoding="utf-8-sig")


def test_build_from_prepared_feed(tmp_path):
    csv_dir = tmp_path / "csv"
    csv_dir.mkdir()
    _write(
        csv_dir / "agency.txt",
        "agency_id,agency_name,agency_url,agency_timezone\n"
        "CM,Capital Metro,https://capmetro.org,America/Chicago\n",
    )
    _write(
        csv_dir / "feed_info.txt",
        "feed_publisher_name,feed_publisher_url,feed_lang,feed_start_date,"
        "feed_end_date,feed_version\n"
        "Capital Metro,https://capmetro.org,en,20260826,20270109,260826_0956\n",
    )
    _write(
        csv_dir / "routes.txt",
        "route_id,route_short_name,route_long_name\n801,801,Rapid\n",
    )
    # prepare.py rewrites lat/lon into WKT points
    _write(
        csv_dir / "stops.txt",
        "stop_id,stop_code,stop_name,stop_loc,on_street\n"
        "1002,1002,Riverside/Burton,POINT(-97.727308 30.240341),\n",
    )
    # Out of order on purpose: the line must follow shape_pt_sequence
    _write(
        csv_dir / "shapes.txt",
        "shape_id,shape_pt_loc,shape_pt_sequence,shape_dist_traveled\n"
        "s1,POINT(-97.2 30.2),2,0.1\n"
        "s1,POINT(-97.1 30.1),1,0.0\n"
        "s1,POINT(-97.3 30.3),10,0.2\n",
    )
    _write(
        csv_dir / "trips.txt",
        "route_id,service_id,trip_id,direction_id,shape_id\n801,svc,t1,0,s1\n",
    )
    _write(
        csv_dir / "stop_times.txt",
        "trip_id,arrival_time,departure_time,stop_id,stop_sequence,pickup_type\n"
        "t1,08:00:00,08:00:00,1002,1,\n",
    )
    _write(
        csv_dir / "calendar_dates.txt",
        "service_id,date,exception_type\nsvc,20260901,1\n",
    )
    _write(csv_dir / "transfers.txt", "from_stop_id,to_stop_id,transfer_type\n")

    db_path = build_database(csv_dir=csv_dir, db_path=tmp_path / "gtfs.db")

    assert not (tmp_path / "gtfs.db.tmp").exists()
    assert get_feed_info(db_path)["feed_start_date"] == "2026-08-26"

    conn = sqlite3.connect(db_path)
    stop = conn.execute(
        "SELECT stop_lat, stop_lon, stop_loc, on_street FROM stops"
    ).fetchone()
    assert stop[:2] == (30.240341, -97.727308)
    assert json.loads(stop[2]) == {
        "type": "Point",
        "coordinates": [-97.727308, 30.240341],
    }
    # Empty CSV fields load as NULL, like Postgres COPY did
    assert stop[3] is None
    assert conn.execute("SELECT pickup_type FROM stop_times").fetchone() == (None,)

    shape = json.loads(
        conn.execute("SELECT shape FROM shapes_aggregated").fetchone()[0]
    )
    assert shape["coordinates"] == [[-97.1, 30.1], [-97.2, 30.2], [-97.3, 30.3]]

    assert conn.execute("SELECT date FROM calendar_dates").fetchone() == ("2026-09-01",)
    assert conn.execute("SELECT route_id, stop_id FROM routes_at_stop").fetchall() == [
        ("801", "1002")
    ]
    conn.close()
