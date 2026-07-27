from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.database.session import Base, engine
from app.core.config import settings
from app.models import (  # noqa: F401
    address,
    branch,
    customer,
    driver,
    invoice,
    package_details,
    payment,
    report,
    route,
    service_option,
    shipment,
    shipment_order,
    staff,
    tracking,
    tracking_history,
    vehicle,
)

if settings.database_url.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartFM API",
    version="0.1.0",
    description="Smart Freight Management System backend foundation.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["Health"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
