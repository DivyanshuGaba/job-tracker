import pytest
from pydantic import ValidationError
from app.config import Settings

ENV_NAMES = [
    "SECRET_KEY", "ALGORITHM", "ACCESS_TOKEN_EXPIRE_MINUTES", "DATABASE_URL",
    "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD", "DB_SSLMODE",
    "CORS_ORIGINS", "API_PREFIX", "LOG_LEVEL", "ENVIRONMENT",
]


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    for name in ENV_NAMES:
        monkeypatch.delenv(name, raising=False)


def make(**kwargs):
    return Settings(_env_file=None, **kwargs)


def test_old_single_database_url_still_works():
    s = make(secret_key="k", database_url="postgresql://u:p@host/db")
    assert s.sqlalchemy_url == "postgresql://u:p@host/db"


def test_render_style_postgres_scheme_is_fixed():
    s = make(secret_key="k", database_url="postgres://u:p@host/db")
    assert s.sqlalchemy_url.startswith("postgresql://")


def test_separate_parts_build_url_and_quote_password():
    s = make(secret_key="k", db_host="h", db_name="d", db_user="u", db_password="p@ss/w:rd", db_sslmode="require")
    assert s.sqlalchemy_url == "postgresql://u:p%40ss%2Fw%3Ard@h:5432/d?sslmode=require"


def test_missing_secret_key_fails():
    with pytest.raises(ValidationError):
        make(database_url="sqlite://")


def test_missing_database_settings_fails_with_clear_message():
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        make(secret_key="k", db_host="h")


def test_defaults_match_old_behaviour():
    s = make(secret_key="k", database_url="sqlite://")
    assert s.api_prefix == ""
    assert s.cors_origin_list == ["*"]
    assert s.algorithm == "HS256"
    assert s.access_token_expire_minutes == 30


def test_prefix_is_normalised():
    assert make(secret_key="k", database_url="sqlite://", api_prefix="api/").api_prefix == "/api"


def test_cors_origins_split_on_commas():
    s = make(secret_key="k", database_url="sqlite://", cors_origins="https://a.com, https://b.com")
    assert s.cors_origin_list == ["https://a.com", "https://b.com"]
