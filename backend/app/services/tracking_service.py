from sqlalchemy.orm import Session

from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.tracking_history_repository import TrackingHistoryRepository
from app.repositories.tracking_repository import TrackingRepository


class TrackingService:
    def __init__(self, db: Session) -> None:
        self.shipment_repository = ShipmentRepository(db)
        self.tracking_history_repository = TrackingHistoryRepository(db)
        self.tracking_repository = TrackingRepository(db)

    def get_tracking(self, track_id: str):
        return self.tracking_repository.get_by_id(track_id)

    def get_tracking_history(self, track_id: str):
        return self.tracking_history_repository.list_by_track_id(track_id)

    def get_shipment(self, shipment_id: int):
        return self.shipment_repository.get_by_id(shipment_id)

    def update_tracking(self, track_id: str):
        raise NotImplementedError("TODO: Implement tracking updates from shipment execution flow.")

