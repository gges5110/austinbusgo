"""Download GTFS data from Texas data portal."""

import os
import subprocess
import zipfile
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
CAPMETRO_DIR = SCRIPT_DIR / "capmetro"
GTFS_URL = "https://data.texas.gov/download/r4v4-vz24/application%2Fzip"
ZIP_PATH = CAPMETRO_DIR / "capmetro.zip"


def download():
    """Download GTFS data from Texas data portal."""
    CAPMETRO_DIR.mkdir(exist_ok=True)

    print("Start downloading GTFS...")
    subprocess.run(
        ["curl", "-L", GTFS_URL, "-o", str(ZIP_PATH)],
        check=True,
    )

    print("Unzipping GTFS files...")
    with zipfile.ZipFile(ZIP_PATH, "r") as zip_ref:
        zip_ref.extractall(CAPMETRO_DIR)

    ZIP_PATH.unlink()
    print("Download complete")


if __name__ == "__main__":
    download()
