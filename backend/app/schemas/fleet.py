from app.schemas.common import ORMModel


class VehicleBase(ORMModel):
    plate_number: str
    vehicle_type: str | None = None
    capacity: float
    status: str | None = None
    branch_id: str | None = None


class VehicleCreate(VehicleBase):
    vehicle_id: str


class VehicleUpdate(ORMModel):
    plate_number: str | None = None
    vehicle_type: str | None = None
    capacity: float | None = None
    status: str | None = None
    branch_id: str | None = None


class VehicleRead(VehicleBase):
    vehicle_id: str


class DriverBase(ORMModel):
    full_name: str
    phone: str
    license_number: str
    status: str | None = None
    branch_id: str | None = None


class DriverCreate(DriverBase):
    driver_id: str


class DriverUpdate(ORMModel):
    full_name: str | None = None
    phone: str | None = None
    license_number: str | None = None
    status: str | None = None
    branch_id: str | None = None


class DriverRead(DriverBase):
    driver_id: str


class AllocationRead(ORMModel):
    shipment_id: int
    order_id: str
    vehicle_id: str | None = None
    driver_id: str | None = None
    route_id: int | None = None
    track_id: str | None = None
    shipment_status: str
