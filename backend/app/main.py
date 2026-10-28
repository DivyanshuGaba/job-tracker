from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import Settings, get_settings
from app.database import engine, Base
import app.models
from app.routers import auth, applications, health

Base.metadata.create_all(bind=engine)


def create_app(settings: Settings) -> FastAPI:
    prefix = settings.api_prefix
    api = FastAPI(
        title="Job Tracker API",
        docs_url=f"{prefix}/docs",
        redoc_url=f"{prefix}/redoc",
        openapi_url=f"{prefix}/openapi.json",
    )

    api.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    api.include_router(health.router)
    api.include_router(auth.router, prefix=prefix)
    api.include_router(applications.router, prefix=prefix)
    if prefix:
        api.include_router(health.router, prefix=prefix)

    @api.get("/")
    def root():
        return {"message": "Job Tracker API is running"}

    return api


app = create_app(get_settings())
