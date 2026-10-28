from pathlib import Path
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect
from app.database import Base
import app.models

ROOT = Path(__file__).resolve().parent.parent


def make_config(url):
    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "alembic"))
    cfg.set_main_option("sqlalchemy.url", url)
    return cfg


def test_upgrade_creates_tables_matching_models(tmp_path):
    url = f"sqlite:///{tmp_path / 'm.db'}"
    command.upgrade(make_config(url), "head")
    engine = create_engine(url)
    assert {"users", "applications", "alembic_version"} <= set(inspect(engine).get_table_names())
    with engine.connect() as conn:
        assert compare_metadata(MigrationContext.configure(conn), Base.metadata) == []


def test_upgrade_is_safe_on_existing_tables(tmp_path):
    url = f"sqlite:///{tmp_path / 'e.db'}"
    Base.metadata.create_all(bind=create_engine(url))
    command.upgrade(make_config(url), "head")
    assert "alembic_version" in inspect(create_engine(url)).get_table_names()


def test_downgrade_removes_tables(tmp_path):
    url = f"sqlite:///{tmp_path / 'd.db'}"
    cfg = make_config(url)
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "base")
    assert "users" not in inspect(create_engine(url)).get_table_names()
