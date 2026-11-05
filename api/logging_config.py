from __future__ import annotations
import contextvars
from collections import deque
import logging
import sys
import time
from typing import Any, Deque, Dict, List, Optional
import structlog

request_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("request_id", default=None)
user_id_ctx: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar("user_id", default=None)

_LOG_BUFFER: Deque[Dict[str, Any]] = deque(maxlen=200)

class LogMemoryBufferHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            entry = {
                "timestamp": record.created,
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "request_id": getattr(record, "request_id", request_id_ctx.get()),
                "user_id": getattr(record, "user_id", user_id_ctx.get()),
            }
            _LOG_BUFFER.append(entry)
        except Exception:
            pass

def get_recent_logs(limit: int = 50, level: Optional[str] = None) -> List[Dict[str, Any]]:
    logs = list(_LOG_BUFFER)
    if level:
        level_upper = level.upper()
        logs = [log for log in logs if log.get("level") == level_upper]
    return logs[-limit:]

def add_context_processor(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    req_id = request_id_ctx.get()
    if req_id and "request_id" not in event_dict:
        event_dict["request_id"] = req_id

    uid = user_id_ctx.get()
    if uid and "user_id" not in event_dict:
        event_dict["user_id"] = uid

    return event_dict

def configure_logging(environment: str = "production", log_level: str = "INFO") -> None:
    level = getattr(logging, log_level.upper(), logging.INFO)

    shared_processors: List[Any] = [
        structlog.contextvars.merge_contextvars,
        add_context_processor,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if environment == "development":
        renderer: Any = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    buffer_handler = LogMemoryBufferHandler()
    buffer_handler.setLevel(level)

    root_logger = logging.getLogger()
    root_logger.handlers = [handler, buffer_handler]
    root_logger.setLevel(level)

def get_logger(name: str = "econocausal") -> Any:
    return structlog.get_logger(name)

