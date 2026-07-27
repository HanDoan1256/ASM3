from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.shipment_order import ShipmentOrder
from app.repositories.base import BaseRepository


class ShipmentOrderRepository(BaseRepository[ShipmentOrder]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, ShipmentOrder)

    def list_recent(self) -> list[ShipmentOrder]:
        return list(self.db.scalars(select(ShipmentOrder).order_by(ShipmentOrder.created_at.desc())).all())

