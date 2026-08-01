from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.shipment import Shipment
from app.repositories.base import BaseRepository


class ShipmentRepository(BaseRepository[Shipment]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Shipment)

    def list_allocations(self) -> list[Shipment]:
        return list(self.db.scalars(select(Shipment).order_by(Shipment.shipment_id.desc())).all())

    def get_by_track_id(self, track_id: str) -> Shipment | None:
        return self.db.scalar(select(Shipment).where(Shipment.track_id == track_id))

    def get_by_order_id(self, order_id: str) -> Shipment | None:
        return self.db.scalar(select(Shipment).where(Shipment.order_id == order_id))
