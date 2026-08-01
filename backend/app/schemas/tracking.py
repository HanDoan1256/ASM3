from datetime import datetime

from app.schemas.common import ORMModel


# =================================================================
# TRACKING HISTORY SCHEMAS
# =================================================================

class TrackingHistoryBase(ORMModel):
    current_location: str
    next_location: str | None = None


class TrackingHistoryCreate(TrackingHistoryBase):
    """Payload sent when logging a new checkpoint entry."""
    pass


class TrackingHistoryRead(TrackingHistoryBase):
    """Response format for timeline history entries."""
    track_history_id: int
    track_id: str
    recorded_at: datetime


# =================================================================
# TRACKING ROOT SCHEMAS
# =================================================================

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


class TrackingStatusUpdate(ORMModel):
    """Schema for drivers/staff to post a status & location update."""
    status: str
    current_location: str
    next_location: str | None = None


class TrackingRead(TrackingBase):
    """Full tracking view, including nested checkpoint history."""
    track_id: str
    history: list[TrackingHistoryRead] = []


# =================================================================
# SHIPMENT LINKED TRACKING SCHEMAS
# =================================================================

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