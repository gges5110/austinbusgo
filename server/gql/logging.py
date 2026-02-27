"""GraphQL logging extension for operation tracking."""

import logging
import time
from typing import Any

from strawberry.extensions import SchemaExtension
from strawberry.types import ExecutionContext

logger = logging.getLogger(__name__)


class GraphQLLoggingExtension(SchemaExtension):
    """Logs GraphQL operations with execution time and errors."""

    def on_request_start(self) -> None:
        """Called when request processing starts."""
        self.start_time = time.time()

    def on_operation_start(self) -> None:
        """Called when GraphQL operation starts executing."""
        if not self.execution_context.operation:
            return

        operation = self.execution_context.operation
        operation_name = operation.name.value if operation.name else "anonymous"
        operation_type = operation.operation.value

        logger.info(f"GraphQL operation started: {operation_name} ({operation_type})")

    def on_operation_complete(self) -> None:
        """Called when GraphQL operation completes."""
        if not self.execution_context.operation:
            return

        duration = time.time() - self.start_time
        operation = self.execution_context.operation
        operation_name = operation.name.value if operation.name else "anonymous"
        result = self.execution_context.result

        error_count = len(result.errors) if result.errors else 0
        status = "error" if error_count > 0 else "success"

        logger.info(
            f"GraphQL operation completed: {operation_name} ({status}) "
            f"duration={duration:.3f}s errors={error_count}"
        )

        if error_count > 0:
            for error in result.errors:
                logger.error(f"  GraphQL error: {error.message}")
