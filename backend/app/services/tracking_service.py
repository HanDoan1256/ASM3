from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.tracking_history_repository import TrackingHistoryRepository
from app.repositories.tracking_repository import TrackingRepository
from app.schemas.tracking import TrackingStatusUpdate


class TrackingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.shipment_repository = ShipmentRepository(db)
        self.tracking_history_repository = TrackingHistoryRepository(db)
        self.tracking_repository = TrackingRepository(db)

    def get_tracking(self, track_id: str):
        tracking = self.tracking_repository.get_by_id(track_id)
        if not tracking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tracking ID '{track_id}' not found."
            )
        return tracking

    def get_tracking_history(self, track_id: str):
        # Verify tracking exists first
        self.get_tracking(track_id)
        return self.tracking_history_repository.list_by_track_id(track_id)

    def get_shipment(self, shipment_id: int):
        shipment = self.shipment_repository.get_by_id(shipment_id)
        if not shipment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Shipment with ID '{shipment_id}' not found."
            )
        return shipment

    def update_tracking(self, track_id: str, payload: TrackingStatusUpdate):
        tracking = self.get_tracking(track_id)

        # 1. Update master tracking state
        tracking.status = payload.status
        tracking.current_location = payload.current_location

        # 2. Append new event entry in tracking history
        self.tracking_history_repository.create(
            track_id=track_id,
            current_location=payload.current_location,
            next_location=payload.next_location
        )

        # 3. Synchronize status across linked Shipment and ShipmentOrder
        if hasattr(tracking, "shipment") and tracking.shipment:
            shipment = tracking.shipment
            shipment.shipment_status = payload.status

            if payload.status == "Delivered" and shipment.shipment_order:
                shipment.shipment_order.order_status = "Delivered"

        self.db.commit()
        self.db.refresh(tracking)
        return tracking