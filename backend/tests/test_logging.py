import json
import logging
from app.logging_config import JsonFormatter, clean_request_id


def make_record(**extra):
    record = logging.LogRecord("app.request", logging.INFO, "f.py", 1, "request", None, None)
    for key, value in extra.items():
        setattr(record, key, value)
    return record


def test_formatter_outputs_one_json_object_with_fields():
    line = JsonFormatter().format(make_record(path="/x", method="GET", status=200, duration_ms=1.5))
    data = json.loads(line)
    assert "\n" not in line
    assert data["message"] == "request"
    assert data["level"] == "INFO"
    assert data["path"] == "/x" and data["status"] == 200 and "timestamp" in data


def test_request_is_logged_with_id_and_header(client, caplog):
    caplog.set_level(logging.INFO, logger="app.request")
    res = client.get("/health/ready", headers={"X-Request-ID": "abc-123"})
    assert res.headers["X-Request-ID"] == "abc-123"
    record = [r for r in caplog.records if r.name == "app.request"][-1]
    assert (record.path, record.method, record.status) == ("/health/ready", "GET", 200)


def test_unsafe_request_id_is_replaced(client):
    res = client.get("/health", headers={"X-Request-ID": "bad id\nwith newline"})
    assert res.headers["X-Request-ID"] != "bad id\nwith newline"
    assert clean_request_id("ok_1", lambda: "new") == "ok_1"
    assert clean_request_id("x" * 80, lambda: "new") == "new"


def test_passwords_and_tokens_are_never_logged(client, caplog):
    caplog.set_level(logging.DEBUG)
    client.post("/auth/register", json={"email": "log@test.com", "password": "SuperSecret999"})
    res = client.post("/auth/login", json={"email": "log@test.com", "password": "SuperSecret999"})
    token = res.json()["access_token"]
    client.get("/applications/", headers={"Authorization": f"Bearer {token}"})
    formatter = JsonFormatter()
    output = " ".join(formatter.format(r) for r in caplog.records)
    assert "SuperSecret999" not in output
    assert token not in output


def test_health_checks_are_not_logged_at_info(client, caplog):
    caplog.set_level(logging.INFO, logger="app.request")
    client.get("/health")
    assert not [r for r in caplog.records if r.name == "app.request"]
