from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.address import Address
from app.repositories.base import BaseRepository


class AddressRepository(BaseRepository[Address]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Address)

    def list_by_customer_id(self, customer_id: str) -> list[Address]:
        return list(self.db.scalars(select(Address).where(Address.customer_id == customer_id)).all())

