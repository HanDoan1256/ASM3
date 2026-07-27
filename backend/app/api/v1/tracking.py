from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.shipment import ShipmentRead
from app.schemas.tracking import TrackingHistoryRead, TrackingRead
from app.services.tracking_service import TrackingService

router = APIRouter()


@router.get("/{track_id}", response_model=TrackingRead)
def get_tracking(track_id: str, db: Session = Depends(get_db)) -> TrackingRead:
    tracking = TrackingService(db).get_tracking(track_id)
    if not tracking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking record not found")
    return tracking


@router.get("/{track_id}/history", response_model=list[TrackingHistoryRead])
def get_tracking_history(track_id: str, db: Session = Depends(get_db)) -> list[TrackingHistoryRead]:
    return TrackingService(db).get_tracking_history(track_id)


@router.get("/shipments/{shipment_id}", response_model=ShipmentRead)
def get_shipment(shipment_id: int, db: Session = Depends(get_db)) -> ShipmentRead:
    shipment = TrackingService(db).get_shipment(shipment_id)
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    return shipment

