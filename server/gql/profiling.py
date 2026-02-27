"""GraphQL query profiling and performance tracking."""

import logging
import re
import time
from typing import Any

from strawberry.extensions import SchemaExtension

logger = logging.getLogger(__name__)


class GraphQLProfilingExtension(SchemaExtension):
    """Profiles GraphQL queries to identify performance bottlenecks."""

    def on_request_start(self) -> None:
        """Called when request processing starts."""
        self.start_time = time.time()
        self.operation_name = self._extract_operation_name()

    def on_request_end(self) -> None:
        """Called when request processing completes."""
        try:
            total_duration = time.time() - self.start_time
            result = self.execution_context.result
            error_count = len(result.errors) if result.errors else 0
            status = "error" if error_count > 0 else "success"

            # Calculate response size
            response_size = self._estimate_response_size(result)

            # Log performance metrics
            logger.info(
                f"GraphQL {self.operation_name} ({status}) "
                f"duration={total_duration:.3f}s "
                f"size={response_size}B "
                f"errors={error_count}"
            )

            # Log slow queries (> 100ms)
            if total_duration > 0.1:
                logger.warning(
                    f"SLOW QUERY: {self.operation_name} took {total_duration:.3f}s"
                )

            if error_count > 0:
                for error in result.errors:
                    logger.error(f"  Error: {error.message}")
        except Exception as e:
            logger.debug(f"Error in GraphQL profiling: {e}")

    def _extract_operation_name(self) -> str:
        """Extract operation name from GraphQL query."""
        try:
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
            r"(?:query|mutation|subscription)\s+(\w+)",
            query_string,
            re.IGNORECASE,
        )
        if match:
            return match.group(1)

        # If no named operation, try to find field name (for anonymous queries)
        match = re.search(
            r"(?:query|mutation|subscription)\s*\{\s*(\w+)",
            query_string,
            re.IGNORECASE,
        )
        if match:
            return match.group(1)

        return "anonymous"

    @staticmethod
    def _estimate_response_size(result: Any) -> int:
        """Estimate response size in bytes."""
        try:
            if hasattr(result, "data") and result.data:
                import json

                return len(json.dumps(result.data))
            return 0
        except Exception:
            return 0
