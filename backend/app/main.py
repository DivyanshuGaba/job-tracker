import logging
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.config import Settings, get_settings
from app.logging_config import clean_request_id, configure_logging, request_id_var
from app.database import engine, Base
import app.models
from app.routers import auth, applications, health

if get_settings().auto_create_tables:
    Base.metadata.create_all(bind=engine)


logger = logging.getLogger("app.request")


def create_app(settings: Settings) -> FastAPI:
    configure_logging(settings.log_level)
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

    @api.middleware("http")
    async def log_requests(request: Request, call_next):
        request_id = clean_request_id(request.headers.get("x-request-id"), lambda: uuid.uuid4().hex)
        token = request_id_var.set(request_id)
        start = time.perf_counter()
        status = 500
        try:
            response = await call_next(request)
            status = response.status_code
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            path = request.url.path
            level = logging.DEBUG if path in ("/health", f"{prefix}/health") else logging.INFO
            logger.log(level, "request", extra={
                "path": path,
                "method": request.method,
                "status": status,
                "duration_ms": round((time.perf_counter() - start) * 1000, 1),
            })
            request_id_var.reset(token)

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
