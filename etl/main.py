"""Main ETL orchestration script for GTFS data."""

import os
import sys
from pathlib import Path

# Add the etl directory to the path so we can import modules
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from download import download
from prepare import prepare
from load_db import load_database


def check_dependencies():
    """Ensure required tools are available."""
    import shutil

    if shutil.which("curl") is None:
        print("curl not found, attempting to install...")
        try:
            import subprocess

            subprocess.run(
                ["sh", str(SCRIPT_DIR / "docker" / "install-curl.sh")],
                check=False,
            )
        except Exception as e:
            print(f"Warning: Could not install curl: {e}")

    if shutil.which("psql") is None:
        raise RuntimeError("psql not found. Please install PostgreSQL client tools.")


def main():
    """Run the complete ETL pipeline."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")

    try:
        print("=" * 60)
        print("GTFS ETL Pipeline")
        print("=" * 60)

        check_dependencies()

        print("\n[1/3] Downloading GTFS data...")
        download()

        print("\n[2/3] Preparing GTFS files...")
        prepare()

        print("\n[3/3] Loading data into database...")
        load_database(database_url)

        print("\n" + "=" * 60)
        print("ETL Pipeline completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
