"""Error handling middleware for Flask application."""

from flask import jsonify
from werkzeug.exceptions import HTTPException

from exceptions import AppException, ValidationError, NotFoundError
from utils.logging import get_logger

logger = get_logger(__name__)


def register_error_handlers(app):
    """
    Register error handlers with the Flask application.

    Args:
        app: Flask application instance
    """

    @app.errorhandler(AppException)
    def handle_app_exception(error: AppException):
        """Handle custom application exceptions."""
        logger.warning(
            f"Application error: {error.code} - {error.message}",
            extra={"error_details": error.details}
        )
        return jsonify(error.to_dict()), 400

    @app.errorhandler(ValidationError)
    def handle_validation_error(error: ValidationError):
        """Handle validation errors."""
        logger.info(f"Validation error: {error.message}")
        return jsonify(error.to_dict()), 400

    @app.errorhandler(NotFoundError)
    def handle_not_found_error(error: NotFoundError):
        """Handle not found errors."""
        logger.info(f"Not found: {error.message}")
        return jsonify(error.to_dict()), 404

    @app.errorhandler(HTTPException)
    def handle_http_exception(error: HTTPException):
        """Handle standard HTTP exceptions."""
        logger.warning(f"HTTP error {error.code}: {error.description}")
        return jsonify({
            "error": {
                "code": f"HTTP_{error.code}",
                "message": error.description
            }
        }), error.code

    @app.errorhandler(Exception)
    def handle_generic_exception(error: Exception):
        """Handle unexpected exceptions."""
        logger.error(
            f"Unexpected error: {str(error)}",
            exc_info=True
        )
        return jsonify({
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred"
            }
        }), 500
