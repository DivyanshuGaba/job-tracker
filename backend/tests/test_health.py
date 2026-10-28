from fastapi.testclient import TestClient
from app.config import Settings
from app.main import create_app


def test_health_returns_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_health_ready_checks_database(client):
    res = client.get("/health/ready")
    assert res.status_code == 200
    assert res.json() == {"status": "ready"}


def test_default_has_no_api_prefix(client):
    assert client.get("/api/health").status_code == 404
    assert client.get("/applications/").status_code == 401


def test_api_prefix_moves_routes():
    settings = Settings(_env_file=None, database_url="sqlite://", secret_key="x", api_prefix="/api")
    prefixed = TestClient(create_app(settings))
    assert prefixed.get("/health").status_code == 200
    assert prefixed.get("/api/health").status_code == 200
    assert prefixed.get("/api/applications/").status_code == 401
    assert prefixed.get("/applications/").status_code == 404
    assert prefixed.get("/api/docs").status_code == 200
