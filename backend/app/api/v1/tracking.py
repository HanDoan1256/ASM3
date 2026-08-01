from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.shipment import ShipmentRead
from app.schemas.tracking import TrackingHistoryRead, TrackingRead, TrackingStatusUpdate
from app.services.tracking_service import TrackingService

router = APIRouter()


@router.get("/{track_id}", response_model=TrackingRead, status_code=status.HTTP_200_OK)
def get_tracking(track_id: str, db: Session = Depends(get_db)) -> TrackingRead:
    """Fetch root tracking status and historical checkpoints by tracking ID."""
    return TrackingService(db).get_tracking(track_id)


@router.get("/{track_id}/history", response_model=list[TrackingHistoryRead], status_code=status.HTTP_200_OK)
def get_tracking_history(track_id: str, db: Session = Depends(get_db)) -> list[TrackingHistoryRead]:
    """Fetch chronological checkpoint timeline for a tracking ID."""
    return TrackingService(db).get_tracking_history(track_id)


@router.post("/{track_id}/events", response_model=TrackingRead, status_code=status.HTTP_200_OK)
def update_tracking_event(
    track_id: str, 
    payload: TrackingStatusUpdate, 
    db: Session = Depends(get_db)
) -> TrackingRead:
    """Post a location update or status transition for an active shipment."""
    return TrackingService(db).update_tracking(track_id, payload)


@router.get("/shipments/{shipment_id}", response_model=ShipmentRead, status_code=status.HTTP_200_OK)
def get_shipment(shipment_id: int, db: Session = Depends(get_db)) -> ShipmentRead:
    """Fetch detailed shipment info by shipment ID."""
    return TrackingService(db).get_shipment(shipment_id)