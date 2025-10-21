"""Abstract cache manager interface."""

from abc import ABC, abstractmethod
from typing import Any, Optional


class CacheManager(ABC):
    """Abstract base class for cache implementations."""

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Store value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (None for no expiration)
        """
        pass

    @abstractmethod
    def delete(self, key: str) -> None:
        """
        Delete value from cache.

        Args:
            key: Cache key
        """
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clear all cached values."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if key exists, False otherwise
        """
        pass

    def get_or_set(self, key: str, factory_fn, ttl: Optional[int] = None) -> Any:
        """
        Get value from cache or set it using factory function.

        Args:
            key: Cache key
            factory_fn: Function to call if key not in cache
            ttl: Time to live in seconds

        Returns:
            Cached or newly created value
        """
        value = self.get(key)
        if value is None:
            value = factory_fn()
            self.set(key, value, ttl)
        return value
