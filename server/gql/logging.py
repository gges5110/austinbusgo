"""GraphQL logging extension for operation tracking."""

import logging
import re
import time

from strawberry.extensions import SchemaExtension

logger = logging.getLogger(__name__)


class GraphQLLoggingExtension(SchemaExtension):
    """Logs GraphQL operations with execution time and errors."""

    def on_request_start(self) -> None:
        """Called when request processing starts."""
        self.start_time = time.time()
        self.operation_name = self._extract_operation_name()

    def on_request_end(self) -> None:
        """Called when request processing completes."""
        try:
            duration = time.time() - self.start_time
            result = self.execution_context.result

            error_count = len(result.errors) if result.errors else 0
            status = "error" if error_count > 0 else "success"

            logger.info(
                f"GraphQL {self.operation_name} ({status}) "
                f"duration={duration:.3f}s errors={error_count}"
            )

            if error_count > 0:
                for error in result.errors:
                    logger.error(f"  Error: {error.message}")
        except Exception as e:
            logger.debug(f"Error in GraphQL logging: {e}")

    def _extract_operation_name(self) -> str:
        """Extract operation name from GraphQL query."""
        try:
            # Try to get from execution context context (request data)
            context = self.execution_context.context
            if hasattr(context, "request"):
                request = context.request
                if hasattr(request, "_body"):
                    body = request._body.decode()
                    return self._parse_operation_name(body)
            return "unknown"
        except Exception:
            return "unknown"

    @staticmethod
    def _parse_operation_name(query_string: str) -> str:
        """Parse operation name from GraphQL query string."""
        # Match: query|mutation|subscription OperationName
        match = re.search(
            r"(?:query|mutation|subscription)\s+(\w+)", query_string, re.IGNORECASE
        )
        if match:
            return match.group(1)

        # If no named operation, try to find field name (for anonymous queries)
        match = re.search(
            r"(?:query|mutation|subscription)\s*\{\s*(\w+)", query_string, re.IGNORECASE
        )
        if match:
            return match.group(1)

        return "anonymous"
