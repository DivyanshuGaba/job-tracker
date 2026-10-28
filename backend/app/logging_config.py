import json
import logging
import re
from contextvars import ContextVar
from datetime import datetime, timezone

request_id_var: ContextVar[str] = ContextVar("request_id", default="")
EXTRA_FIELDS = ("path", "method", "status", "duration_ms")
SAFE_ID = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        data = {
            "timestamp": datetime.fromtimestamp(record.created, timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        request_id = request_id_var.get()
        if request_id:
            data["request_id"] = request_id
        for name in EXTRA_FIELDS:
            if hasattr(record, name):
                data[name] = getattr(record, name)
        if record.exc_info:
            data["exception"] = self.formatException(record.exc_info)
        return json.dumps(data)


def clean_request_id(value, make_new) -> str:
    return value if value and SAFE_ID.match(value) else make_new()


def configure_logging(level: str) -> None:
    root = logging.getLogger()
    root.handlers = [h for h in root.handlers if not getattr(h, "is_json_handler", False)]
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    handler.is_json_handler = True
    root.addHandler(handler)
    root.setLevel(level.upper())
    for name in ("uvicorn", "uvicorn.error"):
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True
    access = logging.getLogger("uvicorn.access")
    access.handlers = []
    access.propagate = False
