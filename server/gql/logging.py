"""GraphQL logging extension for operation tracking."""

import logging
import time

from strawberry.extensions import SchemaExtension

logger = logging.getLogger(__name__)


class GraphQLLoggingExtension(SchemaExtension):
    """Logs GraphQL operations with execution time and errors."""

    def on_request_start(self) -> None:
        """Called when request processing starts."""
        self.start_time = time.time()

    def on_request_end(self) -> None:
        """Called when request processing completes."""
        duration = time.time() - self.start_time
        result = self.execution_context.result

        # Try to get operation name from the document
        operation_name = "anonymous"
        if self.execution_context.operation and self.execution_context.operation.name:
            operation_name = self.execution_context.operation.name.value

        error_count = len(result.errors) if result.errors else 0
        status = "error" if error_count > 0 else "success"

        logger.info(
            f"GraphQL {operation_name} ({status}) duration={duration:.3f}s errors={error_count}"
        )

        if error_count > 0:
            for error in result.errors:
                logger.error(f"  Error: {error.message}")
