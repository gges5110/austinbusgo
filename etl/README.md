# GTFS ETL Pipeline

Downloads CapMetro's GTFS feed and builds the read-only SQLite database (`etl/gtfs.db`) that the backend image ships with.

```bash
python etl/main.py [output.db]   # or: make update-db
```

## Structure

```
etl/
├── main.py              # Entry point: download → prepare → build
├── download.py          # Downloads and unzips the feed into capmetro/
├── prepare.py           # Normalizes times and coordinates in the CSVs
├── build_db.py          # Builds the SQLite database from the CSVs
├── sql/
│   ├── schema.sql       # Tables
│   ├── derived.sql      # Derived tables (routes_at_stop)
│   └── indexes.sql      # Indexes, created after the bulk load
├── docker/
│   └── install-curl.sh  # Alpine Linux curl installation
└── capmetro/            # Downloaded GTFS CSV files (gitignored)
```

Everything is pure-stdlib Python plus `curl`; no database server is involved.

See [docs/etl.md](../docs/etl.md) for how each stage works, how deploys pick up new feeds, and why the data ships as a file.

## Data Source

- [Texas Open Data Portal: CapMetro GTFS](https://data.texas.gov/dataset/CapMetro-GTFS-Data-Feed/r4v4-vz24)
- [GTFS Specification](https://developers.google.com/transit/gtfs/reference)
