"""Structured logging utility for Enosis."""

import logging
import sys
from datetime import datetime


def setup_logger(name: str = "enosis", level: int = logging.INFO) -> logging.Logger:
    """Create a configured logger instance.

    Args:
        name: Logger name.
        level: Logging level (default INFO).

    Returns:
        Configured logger.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)

        fmt = logging.Formatter(
            "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(fmt)
        logger.addHandler(handler)

    return logger


logger = setup_logger()
