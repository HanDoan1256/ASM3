from datetime import datetime

from app.schemas.common import ORMModel


class RouteBase(ORMModel):
    origin: str
    destination: str
    distance: float
    estimated_time: float | None = None


class RouteCreate(RouteBase):
    pass


class RouteUpdate(ORMModel):
    origin: str | None = None
    destination: str | None = None
    distance: float | None = None
    estimated_time: float | None = None


class RouteRead(RouteBase):
    route_id: int


class TrackingBase(ORMModel):
    current_location: str
    last_updated: datetime | None = None
    status: str | None = None


class TrackingCreate(TrackingBase):
    track_id: str


class TrackingUpdate(ORMModel):
    current_location: str | None = None
    last_updated: datetime | None = None
    status: str | None = None


class TrackingRead(TrackingBase):
    track_id: str


class TrackingHistoryBase(ORMModel):
    track_id: str
    current_location: str
    next_location: str | None = None
    recorded_at: datetime


class TrackingHistoryCreate(TrackingHistoryBase):
    pass


class TrackingHistoryRead(TrackingHistoryBase):
    track_history_id: int


class ShipmentTrackingRead(ORMModel):
    shipment_id: int
    order_id: str
    vehicle_id: str | None = None
    driver_id: str | None = None
    route_id: int | None = None
    track_id: str | None = None
    departure_time: datetime | None = None
    arrival_time: datetime | None = None
    shipment_status: str

