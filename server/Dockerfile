# Use Python 3.9 image as base
FROM python:3.9

# Set initial working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    libpq-dev \
    libgeos-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements first (Better for Docker caching)
COPY server/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the server directory
COPY server /app/server

# Set environment variables
ENV PYTHONUNBUFFERED=1
# Ensure /app is in the path so 'import server' works
ENV PYTHONPATH=/app 

EXPOSE 8080

# The Fix: Use the Uvicorn worker and point to the actual file (main.py) and variable (app)
CMD ["gunicorn", \
     "-w", "4", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8080", \
     "--timeout", "120", \
     "server.main:app"]