"""Load GTFS data into PostgreSQL database."""

import csv
import os
import subprocess
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
SQL_DIR = SCRIPT_DIR / "sql"
CAPMETRO_DIR = SCRIPT_DIR / "capmetro"


def get_feed_dates():
    """Extract feed start and end dates from feed_info.txt."""
    feed_info_path = CAPMETRO_DIR / "feed_info.txt"
    with open(feed_info_path, newline="") as f:
        for row in csv.DictReader(f):
            return row["feed_start_date"], row["feed_end_date"]
    return None, None


def get_current_feed_from_db(database_url):
    """Get the current feed start date from the database."""
    try:
        result = subprocess.run(
            [
                "psql",
                database_url,
                "-t",
                "-c",
                "SELECT to_char(feed_start_date, 'YYYYMMDD') FROM feed_info LIMIT 1;",
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return result.stdout.strip() if result.returncode == 0 else None
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None


def run_sql_file(database_url, sql_file):
    """Execute a SQL file against the database."""
    subprocess.run(
        ["psql", database_url, f"--file={sql_file}"],
        check=True,
    )


def generate_summary(current_feed, new_feed, feed_end):
    """Generate GitHub Actions job summary."""
    summary_lines = [
        "## GTFS Database Update Summary",
        "",
        "**Feed Status:**",
    ]

    if current_feed and current_feed == new_feed:
        summary_lines.append("✅ Feed unchanged - database was not reloaded")
        summary_lines.extend(["", "**Current Feed Period:**"])
    else:
        summary_lines.append("✨ Feed updated - database was reloaded")
        summary_lines.extend(["", f"**Previous Feed Start:** {current_feed or 'none'}"])
        summary_lines.append("")
        summary_lines.append("**New Feed Period:**")

    summary_lines.extend(
        [
            f"- Start: {new_feed}",
            f"- End: {feed_end}",
            "",
            f"**Timestamp:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
        ]
    )

    # Write to GitHub Actions summary if available
    summary_file = os.getenv("GITHUB_STEP_SUMMARY")
    if summary_file:
        with open(summary_file, "a") as f:
            f.write("\n".join(summary_lines) + "\n")
    else:
        # Fallback: print to stdout if not in GitHub Actions
        print("\n" + "\n".join(summary_lines))


def load_database(database_url):
    """Load GTFS data into the database."""
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    # Ensure required extensions exist even when the reload below is
    # skipped — a newly required extension must not wait for CapMetro to
    # publish a new feed.
    print("Ensuring database extensions...")
    run_sql_file(database_url, SQL_DIR / "extensions.sql")

    # Get feed dates
    new_feed, feed_end = get_feed_dates()
    if not new_feed:
        raise FileNotFoundError("Could not read feed_info.txt")

    # Check if feed has changed
    current_feed = get_current_feed_from_db(database_url)

    if current_feed and current_feed == new_feed:
        print(f"Feed start date unchanged ({current_feed}), skipping database reload.")
        generate_summary(current_feed, new_feed, feed_end)
        return

    print(
        f"Loading new GTFS feed (feed_start_date: {new_feed}, was: {current_feed or 'none'})"
    )

    # Run SQL files in order
    print("Dropping old schema...")
    run_sql_file(database_url, SQL_DIR / "teardown.sql")

    print("Creating new schema...")
    run_sql_file(database_url, SQL_DIR / "schema.sql")

    print("Loading GTFS data...")
    run_sql_file(database_url, SQL_DIR / "load.sql")

    print("Creating indexes...")
    run_sql_file(database_url, SQL_DIR / "indexes.sql")

    print("Database load complete")
    generate_summary(current_feed, new_feed, feed_end)


if __name__ == "__main__":
    database_url = os.getenv("DATABASE_URL")
    load_database(database_url)
