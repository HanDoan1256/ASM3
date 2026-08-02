from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import Principal, get_current_principal, get_db, require_staff
from app.schemas.shipment import ShipmentRead
from app.schemas.tracking import TrackingHistoryRead, TrackingRead, TrackingStatusUpdate
from app.services.order_service import OrderService
from app.services.tracking_service import TrackingService

router = APIRouter()


@router.get("/orders/{order_id}", response_model=ShipmentRead, status_code=status.HTTP_200_OK)
def get_shipment_by_order(
    order_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> ShipmentRead:
    service = TrackingService(db)
    order = OrderService(db).get_order(order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    if principal.principal_type == "customer" and order.customer_id != principal.principal_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    shipment = service.shipment_repository.get_by_order_id(order_id)
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    return shipment


@router.get("/{track_id}", response_model=TrackingRead, status_code=status.HTTP_200_OK)
def get_tracking(
    track_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> TrackingRead:
    """Fetch root tracking status and historical checkpoints by tracking ID."""
    service = TrackingService(db)
    tracking = service.get_tracking(track_id)
    if principal.principal_type == "customer":
        shipment = service.shipment_repository.get_by_track_id(track_id)
        order = OrderService(db).get_order(shipment.order_id) if shipment else None
        if not order or order.customer_id != principal.principal_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking record not found")
    return tracking


@router.get("/{track_id}/history", response_model=list[TrackingHistoryRead], status_code=status.HTTP_200_OK)
def get_tracking_history(
    track_id: str,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> list[TrackingHistoryRead]:
    """Fetch chronological checkpoint timeline for a tracking ID."""
    service = TrackingService(db)
    tracking = service.get_tracking(track_id)
    if principal.principal_type == "customer":
        shipment = service.shipment_repository.get_by_track_id(track_id)
        order = OrderService(db).get_order(shipment.order_id) if shipment else None
        if not order or order.customer_id != principal.principal_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking record not found")
    return service.get_tracking_history(tracking.track_id)


@router.post("/{track_id}/events", response_model=TrackingRead, status_code=status.HTTP_200_OK)
def update_tracking_event(
    track_id: str,
    payload: TrackingStatusUpdate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(require_staff),
) -> TrackingRead:
    """Post a location update or status transition for an active shipment. Staff-only."""
    try:
        return TrackingService(db).update_tracking(track_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/shipments/{shipment_id}", response_model=ShipmentRead, status_code=status.HTTP_200_OK)
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
) -> ShipmentRead:
    """Fetch detailed shipment info by shipment ID."""
    shipment = TrackingService(db).get_shipment(shipment_id)
    if principal.principal_type == "customer":
        order = OrderService(db).get_order(shipment.order_id)
        if not order or order.customer_id != principal.principal_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found")
    return shipment
