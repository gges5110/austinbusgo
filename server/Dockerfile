# Use Python 3.11 slim image as base
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY server/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the server directory
COPY server ./server

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=server.app:create_app()

# Expose port 8080 (as referenced in deployment script)
EXPOSE 8080

# Run gunicorn with the Flask app
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "4", "--timeout", "120", "--config", "server/gunicorn_config.py", "server.app:create_app()"]
