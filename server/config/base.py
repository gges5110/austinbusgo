import os
from urllib.parse import quote_plus


class Config:
    """Application configuration manager."""

    @staticmethod
    def get_database_url() -> str:
        """
        Get database URL from environment variables.
        Tries DATABASE_URL first, otherwise builds from PG* environment variables.

        Returns:
            str: PostgreSQL connection URL
        """
        db_url = os.environ.get("DATABASE_URL")

        if not db_url and os.environ.get("PGHOST"):
            pghost = os.environ.get("PGHOST")
            pgport = os.environ.get("PGPORT", "5432")
            pguser = os.environ.get("PGUSER")
            pgpassword = os.environ.get("PGPASSWORD")
            pgdatabase = os.environ.get("PGDATABASE", "postgres")
            pgsslmode = os.environ.get("PGSSLMODE", "prefer")

            # Build DATABASE_URL, properly encoding the password
            # The password (IAM token) contains special chars, so we URL-encode it
            encoded_password = quote_plus(pgpassword) if pgpassword else ""
            db_url = f"postgresql://{pguser}:{encoded_password}@{pghost}:{pgport}/{pgdatabase}?sslmode={pgsslmode}"

        return db_url

    @staticmethod
    def get_env(key: str, default=None):
        """Get environment variable with optional default."""
        return os.environ.get(key, default)

    @staticmethod
    def is_production() -> bool:
        """Check if running in production mode."""
        return os.environ.get("FLASK_ENV") == "production"

    @staticmethod
    def is_debug() -> bool:
        """Check if running in debug mode."""
        return os.environ.get("FLASK_DEBUG", "0") == "1"
