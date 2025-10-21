"""Logging middleware for request/response tracking."""

import time
from flask import request, g
from utils.logging import get_logger

logger = get_logger(__name__)


class LoggingMiddleware:
    """Middleware to log HTTP requests and responses."""

    def __init__(self, app=None):
        """
        Initialize logging middleware.

        Args:
            app: Flask application instance
        """
        self.app = app
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        """
        Register middleware with Flask app.

        Args:
            app: Flask application instance
        """
        app.before_request(self.before_request)
        app.after_request(self.after_request)

    @staticmethod
    def before_request():
        """Log request start and store start time."""
        g.start_time = time.time()
        logger.debug(
            f"Request started: {request.method} {request.path}",
            extra={
                "method": request.method,
                "path": request.path,
                "remote_addr": request.remote_addr
            }
        )

    @staticmethod
    def after_request(response):
        """Log request completion with duration."""
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            logger.info(
                f"Request completed: {request.method} {request.path} - "
                f"Status: {response.status_code} - Duration: {duration:.3f}s",
                extra={
                    "method": request.method,
                    "path": request.path,
                    "status_code": response.status_code,
                    "duration": duration
                }
            )
        return response
