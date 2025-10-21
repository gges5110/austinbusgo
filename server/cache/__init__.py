from .cache_manager import CacheManager
from .memory_cache import MemoryCache

# Create default cache instance
cache = MemoryCache()

__all__ = ['CacheManager', 'MemoryCache', 'cache']
