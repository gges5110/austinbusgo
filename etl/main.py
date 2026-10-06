"""Main ETL orchestration script for GTFS data.

Downloads the latest CapMetro feed and builds the SQLite database the
backend serves from. Usage: python main.py [output.db]
"""

import shutil
import subprocess
import sys
from pathlib import Path

# Add the etl directory to the path so we can import modules
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from build_db import DEFAULT_DB_PATH, build_database, get_feed_info
from download import download
from prepare import prepare


def check_dependencies():
    """Ensure required tools are available."""
    if shutil.which("curl") is None:
        print("curl not found, attempting to install...")
        try:
            subprocess.run(
                ["sh", str(SCRIPT_DIR / "docker" / "install-curl.sh")],
                check=False,
            )
        except Exception as e:
            print(f"Warning: Could not install curl: {e}")


def main():
    """Run the complete ETL pipeline."""
    db_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DB_PATH

    try:
        print("=" * 60)
        print("GTFS ETL Pipeline")
        print("=" * 60)

        check_dependencies()

        print("\n[1/3] Downloading GTFS data...")
        download()

        print("\n[2/3] Preparing GTFS files...")
        prepare()

        print("\n[3/3] Building SQLite database...")
        build_database(db_path=db_path)

        feed = get_feed_info(db_path)
        print("\n" + "=" * 60)
        print(
            f"ETL Pipeline completed successfully! Feed {feed['feed_version']}"
            f" ({feed['feed_start_date']} to {feed['feed_end_date']})"
        )
        print("=" * 60)

    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
