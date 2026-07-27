from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.repositories.base import BaseRepository


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Payment)

    def list_recent(self) -> list[Payment]:
        return list(self.db.scalars(select(Payment).order_by(Payment.payment_date.desc())).all())

