"""Shared pytest fixtures for the SmartFM backend test suite.

Uses a fresh, isolated SQLite database file per test session so tests never
touch a developer's local app.db or a real Postgres/Supabase instance. The
DATABASE_URL environment variable is set BEFORE importing `app.main`, since
the engine/session are created at import time.
"""
import os
import tempfile

import pytest

_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"

from fastapi.testclient import TestClient  # noqa: E402

from app.database.session import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.driver import Driver  # noqa: E402
from app.models.service_option import ServiceOption  # noqa: E402
from app.models.staff import Staff  # noqa: E402
from app.models.vehicle import Vehicle  # noqa: E402
from app.utils.security import hash_password  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session", autouse=True)
def seed_reference_data():
    """Seed the operational reference data that has no public creation
    endpoint (staff, vehicles, drivers, service options) directly via the ORM,
    mirroring how these rows would be provisioned by an admin/ops process."""
    db = SessionLocal()
    try:
        db.add(
            ServiceOption(
                service_name="Standard Delivery",
                description="Standard ground delivery",
                base_price=50000,
                estimated_days=3,
            )
        )
        db.add(
            Staff(
                staff_id="STF-TEST01",
                full_name="Test Staff",
                email="staff.test@example.com",
                phone="0900000000",
                password_hash=hash_password("StaffPass123!"),
                role="Staff",
                status="Active",
            )
        )
        db.add(
            Vehicle(
                vehicle_id="VEH-TEST01",
                plate_number="TEST-001",
                vehicle_type="Truck",
                capacity=5.0,
                status="Available",
            )
        )
        db.add(
            Driver(
                driver_id="DRV-TEST01",
                full_name="Test Driver",
                license_number="LIC-TEST01",
                phone="0911111111",
                status="Available",
            )
        )
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def staff_token(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "staff.test@example.com", "password": "StaffPass123!"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture()
def staff_headers(staff_token):
    return {"Authorization": f"Bearer {staff_token}"}
