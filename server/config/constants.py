"""Application-wide constants."""

# Time constants
SECONDS_PER_MINUTE = 60
MINUTES_PER_HOUR = 60
SECONDS_PER_HOUR = SECONDS_PER_MINUTE * MINUTES_PER_HOUR

# Distance constants (meters)
DEFAULT_SEARCH_RADIUS = 1000  # meters
MAX_SEARCH_RADIUS = 5000  # meters

# Cache TTL (seconds)
STATIC_DATA_CACHE_TTL = 3600  # 1 hour (GTFS data rarely changes)
REALTIME_DATA_CACHE_TTL = 30  # 30 seconds (real-time data)

# Query limits
DEFAULT_QUERY_LIMIT = 100
MAX_QUERY_LIMIT = 1000

# Timezone
DEFAULT_TIMEZONE = "America/Chicago"  # Austin, TX timezone
