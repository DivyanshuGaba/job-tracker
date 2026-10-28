from alembic import context
from sqlalchemy import create_engine, pool
from app.config import get_settings
from app.database import Base
import app.models

config = context.config
target_metadata = Base.metadata


def get_url() -> str:
    return config.get_main_option("sqlalchemy.url") or get_settings().sqlalchemy_url


def run_migrations_offline():
    context.configure(url=get_url(), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    engine = create_engine(get_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
