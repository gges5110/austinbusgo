FROM python:3.11-slim

# Set initial working directory
WORKDIR /app

# Copy pyproject.toml first (better for Docker caching)
COPY server/pyproject.toml .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel hatchling

# Install Python dependencies
RUN pip install --no-cache-dir .

# Copy the server directory
COPY server /app/server

# The read-only GTFS database, built beforehand by `python etl/main.py`
# (the deploy workflow does this). The image is the unit of data deployment:
# a new feed ships as a new image.
COPY etl/gtfs.db /app/data/gtfs.db

# Set environment variables
ENV PYTHONUNBUFFERED=1
# Ensure /app is in the path so 'import server' works
ENV PYTHONPATH=/app
ENV GTFS_DB_PATH=/app/data/gtfs.db

EXPOSE 8080

# The Fix: Use the Uvicorn worker and point to the actual file (main.py) and variable (app)
# Two async workers: Cloud Run gives the container 1 vCPU and 512Mi, and each
# worker holds ~100MB (app + SQLite page cache + search caches).
CMD ["gunicorn", \
     "-w", "2", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8080", \
     "--timeout", "120", \
     "server.main:app"]
