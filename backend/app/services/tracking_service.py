from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.statuses import (
    ORDER_TRANSITIONS,
    ORDER_STATUSES,
    RESOURCE_STATUSES,
    RESOURCE_TRANSITIONS,
    SHIPMENT_STATUSES,
    SHIPMENT_TRANSITIONS,
    TRACKING_STATUSES,
    ensure_allowed_status,
    ensure_valid_transition,
    map_shipment_to_resource_status,
    map_tracking_to_order_status,
    normalize_order_status,
    normalize_resource_status,
    normalize_shipment_status,
    normalize_tracking_status,
)
from app.models.tracking_history import TrackingHistory
from app.repositories.driver_repository import DriverRepository
from app.repositories.shipment_order_repository import ShipmentOrderRepository
from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.tracking_history_repository import TrackingHistoryRepository
from app.repositories.tracking_repository import TrackingRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.tracking import TrackingStatusUpdate


class TrackingService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.driver_repository = DriverRepository(db)
        self.order_repository = ShipmentOrderRepository(db)
        self.shipment_repository = ShipmentRepository(db)
        self.tracking_history_repository = TrackingHistoryRepository(db)
        self.tracking_repository = TrackingRepository(db)
        self.vehicle_repository = VehicleRepository(db)

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
        next_tracking_status = normalize_tracking_status(payload.status)
        current_tracking_status = normalize_tracking_status(tracking.status)

        ensure_allowed_status("tracking", next_tracking_status, TRACKING_STATUSES)
        ensure_valid_transition("tracking", current_tracking_status, next_tracking_status, SHIPMENT_TRANSITIONS)

        # 1. Update master tracking state
        tracking.status = next_tracking_status
        tracking.current_location = payload.current_location

        # 2. Append new event entry in tracking history
        self.tracking_history_repository.create(
            TrackingHistory(
                track_id=track_id,
                current_location=payload.current_location,
                next_location=payload.next_location,
            )
        )

        # 3. Synchronize status across linked Shipment and ShipmentOrder
        shipment = self.shipment_repository.get_by_track_id(track_id)
        if shipment:
            next_shipment_status = normalize_shipment_status(next_tracking_status)
            current_shipment_status = normalize_shipment_status(shipment.shipment_status)

            ensure_allowed_status("shipment", next_shipment_status, SHIPMENT_STATUSES)
            ensure_valid_transition("shipment", current_shipment_status, next_shipment_status, SHIPMENT_TRANSITIONS)
            shipment.shipment_status = next_shipment_status

            order = self.order_repository.get_by_id(shipment.order_id)
            if order:
                next_order_status = map_tracking_to_order_status(next_tracking_status)
                current_order_status = normalize_order_status(order.order_status)
                ensure_allowed_status("order", next_order_status, ORDER_STATUSES)
                ensure_valid_transition("order", current_order_status, next_order_status, ORDER_TRANSITIONS)
                order.order_status = next_order_status

            resource_status = map_shipment_to_resource_status(next_shipment_status)
            if shipment.vehicle_id and resource_status:
                vehicle = self.vehicle_repository.get_by_id(shipment.vehicle_id)
                if vehicle:
                    current_vehicle_status = normalize_resource_status(vehicle.status)
                    ensure_allowed_status("vehicle", resource_status, RESOURCE_STATUSES)
                    ensure_valid_transition("vehicle", current_vehicle_status, resource_status, RESOURCE_TRANSITIONS)
                    vehicle.status = resource_status

            if shipment.driver_id and resource_status:
                driver = self.driver_repository.get_by_id(shipment.driver_id)
                if driver:
                    current_driver_status = normalize_resource_status(driver.status)
                    ensure_allowed_status("driver", resource_status, RESOURCE_STATUSES)
                    ensure_valid_transition("driver", current_driver_status, resource_status, RESOURCE_TRANSITIONS)
                    driver.status = resource_status

        self.db.commit()
        self.db.refresh(tracking)
        return tracking
