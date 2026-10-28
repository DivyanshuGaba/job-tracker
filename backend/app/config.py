from functools import lru_cache
from typing import List, Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    database_url: Optional[str] = None
    db_host: Optional[str] = None
    db_port: int = 5432
    db_name: Optional[str] = None
    db_user: Optional[str] = None
    db_password: Optional[str] = None
    db_sslmode: Optional[str] = None

    cors_origins: str = "*"
    api_prefix: str = ""
    log_level: str = "INFO"
    environment: str = "local"

    @model_validator(mode="after")
    def check_database_settings(self):
        parts = [self.db_host, self.db_name, self.db_user, self.db_password]
        if not self.database_url and not all(parts):
            raise ValueError(
                "Set DATABASE_URL, or set all of DB_HOST, DB_NAME, DB_USER and DB_PASSWORD"
            )
        prefix = self.api_prefix.strip().strip("/")
        self.api_prefix = f"/{prefix}" if prefix else ""
        return self

    @property
    def sqlalchemy_url(self) -> str:
        if self.database_url:
            url = self.database_url
            if url.startswith("postgres://"):
                url = "postgresql://" + url[len("postgres://"):]
            return url
        query = {"sslmode": self.db_sslmode} if self.db_sslmode else {}
        return URL.create(
            "postgresql",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
            query=query,
        ).render_as_string(hide_password=False)

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
