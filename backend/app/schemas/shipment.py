from datetime import datetime

from app.schemas.common import ORMModel


class ShipmentBase(ORMModel):
    order_id: str
    vehicle_id: str | None = None
    driver_id: str | None = None
    route_id: int | None = None
    track_id: str | None = None
    departure_time: datetime | None = None
    arrival_time: datetime | None = None
    shipment_status: str


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(ORMModel):
    vehicle_id: str | None = None
    driver_id: str | None = None
    route_id: int | None = None
    track_id: str | None = None
    departure_time: datetime | None = None
    arrival_time: datetime | None = None
    shipment_status: str | None = None


class ShipmentRead(ShipmentBase):
    shipment_id: int
