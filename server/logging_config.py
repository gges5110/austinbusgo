"""Logging configuration for FastAPI application."""

import logging

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Set specific loggers
logger = logging.getLogger(__name__)
gql_logger = logging.getLogger("server.gql.logging")
gql_logger.setLevel(logging.INFO)

# Reduce noise from other libraries
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
