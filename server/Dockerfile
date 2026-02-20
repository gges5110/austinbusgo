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

# Copy the server directory contents as a package
COPY server /app/server

# Set working directory to the application root within the container
WORKDIR /app/server

# Copy requirements file (now relative to /app/server)
COPY server/requirements.txt .

# Upgrade pip and install build essentials
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV FLASK_APP=server.app:create_app()

# Expose port 8080 (as referenced in deployment script)
EXPOSE 8080

# Run gunicorn with the Flask app
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "4", "--timeout", "120", "server.app:create_app()"]
