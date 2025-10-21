"""Base exception classes for the application."""


class AppException(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, code: str = None, details: dict = None):
        super().__init__(message)
        self.message = message
        self.code = code or self.__class__.__name__
        self.details = details or {}

    def to_dict(self):
        """Convert exception to dictionary for JSON responses."""
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details
            }
        }


class ValidationError(AppException):
    """Raised when input validation fails."""

    def __init__(self, message: str, field: str = None, details: dict = None):
        super().__init__(message, "VALIDATION_ERROR", details)
        self.field = field


class NotFoundError(AppException):
    """Raised when a requested resource is not found."""

    def __init__(self, resource_type: str, identifier: str = None):
        message = f"{resource_type} not found"
        if identifier:
            message += f": {identifier}"
        super().__init__(message, "NOT_FOUND")
        self.resource_type = resource_type
        self.identifier = identifier


class DatabaseError(AppException):
    """Raised when database operations fail."""

    def __init__(self, message: str, query: str = None):
        super().__init__(message, "DATABASE_ERROR")
        self.query = query


class ExternalAPIError(AppException):
    """Raised when external API calls fail."""

    def __init__(self, message: str, api_name: str = None, status_code: int = None):
        super().__init__(message, "EXTERNAL_API_ERROR")
        self.api_name = api_name
        self.status_code = status_code
