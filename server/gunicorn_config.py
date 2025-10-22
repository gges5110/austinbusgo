def post_fork(server, worker):
    """
    Called just after a worker has been forked.
    Close and reinitialize database connections in each worker.
    """
    from server.database import db_wrapper

    # Close any existing connection from the parent process
    if not db_wrapper.database.is_closed():
        db_wrapper.database.close()

    # The FlaskDB wrapper will automatically reconnect on first request


def worker_exit(server, worker):
    """
    Called just after a worker has exited.
    """
    from server.database import db_wrapper

    if not db_wrapper.database.is_closed():
        db_wrapper.database.close()
