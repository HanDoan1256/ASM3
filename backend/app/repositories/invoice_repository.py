from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.invoice import Invoice
from app.repositories.base import BaseRepository


class InvoiceRepository(BaseRepository[Invoice]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Invoice)

    def get_by_order_id(self, order_id: str) -> Invoice | None:
        return self.db.scalar(select(Invoice).where(Invoice.order_id == order_id))

